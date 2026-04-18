import { DEFAULT_SOLFEGE_WINDOWS, SOLFEGE_NOTE_IDS, type SolfegeNoteId } from '@shared/config/solfege';
import type { PitchTargetMatchState } from '@features/audio/pitch';
import type { GameplayTuning, PromptDefinition, PromptState } from './contracts';

export type PromptAdvanceOutcome = 'assigned' | 'holding' | 'cleared' | 'rotated' | 'breathing';

export interface PromptAdvanceResult {
  promptState: PromptState;
  promptOutcome: PromptAdvanceOutcome;
  previousPrompt: PromptDefinition | null;
  currentPrompt: PromptDefinition | null;
  noteMatchedMs: number;
}

const PROMPT_DEFINITION_MAP = Object.fromEntries(
  DEFAULT_SOLFEGE_WINDOWS.map((window, index) => [
    window.id,
    {
      noteId: window.id,
      label: window.label,
      scientificPitch: window.scientificPitch,
      sequenceIndex: index,
    },
  ]),
) as Record<SolfegeNoteId, PromptDefinition>;

export function createPromptSequence(
  noteIds: ReadonlyArray<SolfegeNoteId> = SOLFEGE_NOTE_IDS,
): ReadonlyArray<PromptDefinition> {
  return noteIds.map((noteId, index) => ({
    ...PROMPT_DEFINITION_MAP[noteId],
    sequenceIndex: index,
  }));
}

export function createPromptState(
  sequence: ReadonlyArray<PromptDefinition> = createPromptSequence(),
): PromptState {
  const [currentPrompt] = sequence;

  return {
    sequence,
    nextPromptIndex: sequence.length > 0 ? 1 % sequence.length : 0,
    currentPrompt: currentPrompt ?? null,
    promptAgeMs: 0,
    holdProgressMs: 0,
    breathRemainingMs: 0,
    promptsPresented: currentPrompt ? 1 : 0,
    promptsCleared: 0,
  };
}

export function advancePromptState(params: {
  promptState: PromptState;
  matchState: PitchTargetMatchState;
  elapsedMs: number;
  tuning: GameplayTuning;
}): PromptAdvanceResult {
  const { matchState, tuning } = params;
  let { elapsedMs } = params;
  let promptState = ensurePromptState(params.promptState);

  // --- Breathing gap phase ---
  if (promptState.breathRemainingMs > 0) {
    const breathConsumed = Math.min(promptState.breathRemainingMs, elapsedMs);
    const breathRemaining = promptState.breathRemainingMs - breathConsumed;
    elapsedMs -= breathConsumed;

    if (breathRemaining > 0) {
      return {
        promptState: { ...promptState, breathRemainingMs: breathRemaining },
        promptOutcome: 'breathing',
        previousPrompt: null,
        currentPrompt: null,
        noteMatchedMs: 0,
      };
    }

    // Breathing ended — activate the next note
    promptState = activateNextPrompt(promptState);

    if (elapsedMs <= 0) {
      return {
        promptState,
        promptOutcome: 'holding',
        previousPrompt: null,
        currentPrompt: promptState.currentPrompt,
        noteMatchedMs: 0,
      };
    }
    // Fall through to process remaining time with the new note
  }

  // --- No active prompt ---
  const previousPrompt = promptState.currentPrompt;
  if (!previousPrompt) {
    return {
      promptState,
      promptOutcome: 'assigned',
      previousPrompt: null,
      currentPrompt: null,
      noteMatchedMs: 0,
    };
  }

  // --- Active note phase ---
  const promptAgeMs = promptState.promptAgeMs + elapsedMs;
  const holdProgressMs = getNextHoldProgress(promptState.holdProgressMs, elapsedMs, matchState, tuning);

  if (holdProgressMs >= tuning.promptHoldMs) {
    const breathingState = enterBreathing(promptState, true, tuning);

    return {
      promptState: breathingState,
      promptOutcome: 'cleared',
      previousPrompt,
      currentPrompt: null,
      noteMatchedMs: elapsedMs,
    };
  }

  if (promptAgeMs >= tuning.promptCadenceMs) {
    const breathingState = enterBreathing(
      { ...promptState, promptAgeMs, holdProgressMs },
      false,
      tuning,
    );

    return {
      promptState: breathingState,
      promptOutcome: 'rotated',
      previousPrompt,
      currentPrompt: null,
      noteMatchedMs: matchState === 'correct' ? elapsedMs : 0,
    };
  }

  return {
    promptState: {
      ...promptState,
      promptAgeMs,
      holdProgressMs,
    },
    promptOutcome: 'holding',
    previousPrompt,
    currentPrompt: previousPrompt,
    noteMatchedMs: matchState === 'correct' ? elapsedMs : 0,
  };
}

function ensurePromptState(promptState: PromptState): PromptState {
  if (promptState.currentPrompt || promptState.breathRemainingMs > 0 || promptState.sequence.length === 0) {
    return promptState;
  }

  return createPromptState(promptState.sequence);
}

/**
 * Enter the breathing gap after a note is cleared or timed out.
 * `currentPrompt` is set to null so no note is targeted during the gap.
 * `promptsPresented` is NOT incremented — that happens when the next note activates.
 */
function enterBreathing(promptState: PromptState, countAsCleared: boolean, tuning: GameplayTuning): PromptState {
  return {
    ...promptState,
    currentPrompt: null,
    promptAgeMs: 0,
    holdProgressMs: 0,
    breathRemainingMs: tuning.breathGapMs,
    promptsCleared: promptState.promptsCleared + Number(countAsCleared),
  };
}

/**
 * Activate the next note in the sequence after the breathing gap ends.
 * This is where `promptsPresented` is incremented.
 */
function activateNextPrompt(promptState: PromptState): PromptState {
  const sequence = promptState.sequence;

  if (sequence.length === 0) {
    return { ...promptState, breathRemainingMs: 0 };
  }

  const currentPrompt = sequence[promptState.nextPromptIndex] ?? sequence[0] ?? null;
  const nextPromptIndex = sequence.length > 0 ? (promptState.nextPromptIndex + 1) % sequence.length : 0;

  return {
    ...promptState,
    currentPrompt,
    nextPromptIndex,
    promptAgeMs: 0,
    holdProgressMs: 0,
    breathRemainingMs: 0,
    promptsPresented: promptState.promptsPresented + (currentPrompt ? 1 : 0),
  };
}

function getNextHoldProgress(
  currentHoldProgressMs: number,
  elapsedMs: number,
  matchState: PitchTargetMatchState,
  tuning: GameplayTuning,
) {
  if (matchState === 'correct') {
    return Math.min(tuning.promptHoldMs, currentHoldProgressMs + elapsedMs);
  }

  const decayMs = Math.ceil((elapsedMs * tuning.promptHoldMs) / Math.max(tuning.promptDecayMs, 1));

  return Math.max(0, currentHoldProgressMs - decayMs);
}
