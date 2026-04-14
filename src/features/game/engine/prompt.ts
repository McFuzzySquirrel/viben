import { DEFAULT_SOLFEGE_WINDOWS, SOLFEGE_NOTE_IDS, type SolfegeNoteId } from '@shared/config/solfege';
import type { PitchTargetMatchState } from '@features/audio/pitch';
import type { GameplayTuning, PromptDefinition, PromptState } from './contracts';

export type PromptAdvanceOutcome = 'assigned' | 'holding' | 'cleared' | 'rotated';

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
  const { elapsedMs, matchState, tuning } = params;
  const promptState = ensurePromptState(params.promptState);
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

  const promptAgeMs = promptState.promptAgeMs + elapsedMs;
  const holdProgressMs = getNextHoldProgress(promptState.holdProgressMs, elapsedMs, matchState, tuning);

  if (holdProgressMs >= tuning.promptHoldMs) {
    const nextPromptState = rotatePrompt(promptState, true);

    return {
      promptState: nextPromptState,
      promptOutcome: 'cleared',
      previousPrompt,
      currentPrompt: nextPromptState.currentPrompt,
      noteMatchedMs: elapsedMs,
    };
  }

  if (promptAgeMs >= tuning.promptCadenceMs) {
    const rotatedState = rotatePrompt(
      {
        ...promptState,
        promptAgeMs,
        holdProgressMs,
      },
      false,
    );

    return {
      promptState: rotatedState,
      promptOutcome: 'rotated',
      previousPrompt,
      currentPrompt: rotatedState.currentPrompt,
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
  if (promptState.currentPrompt || promptState.sequence.length === 0) {
    return promptState;
  }

  return createPromptState(promptState.sequence);
}

function rotatePrompt(promptState: PromptState, countAsCleared: boolean): PromptState {
  const sequence = promptState.sequence;

  if (sequence.length === 0) {
    return promptState;
  }

  const currentPrompt = sequence[promptState.nextPromptIndex] ?? sequence[0] ?? null;
  const nextPromptIndex = sequence.length > 0 ? (promptState.nextPromptIndex + 1) % sequence.length : 0;

  return {
    ...promptState,
    currentPrompt,
    nextPromptIndex,
    promptAgeMs: 0,
    holdProgressMs: 0,
    promptsPresented: promptState.promptsPresented + (currentPrompt ? 1 : 0),
    promptsCleared: promptState.promptsCleared + Number(countAsCleared),
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
