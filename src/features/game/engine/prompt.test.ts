import { describe, expect, it } from 'vitest';
import { advancePromptState, createPromptSequence, createPromptState } from './prompt';
import { buildGameplayTuning } from './tuning';

describe('prompt progression', () => {
  it('clears a prompt and enters breathing gap before the next note', () => {
    const tuning = buildGameplayTuning('easy', {
      promptHoldMs: 500,
      promptCadenceMs: 2_000,
    });
    const sequence = createPromptSequence(['do', 're', 'mi']);
    const promptState = createPromptState(sequence);

    const result = advancePromptState({
      promptState,
      matchState: 'correct',
      elapsedMs: 500,
      tuning,
    });

    expect(result.promptOutcome).toBe('cleared');
    expect(result.previousPrompt?.noteId).toBe('do');
    // During breathing gap, currentPrompt is null
    expect(result.currentPrompt).toBeNull();
    expect(result.promptState.promptsCleared).toBe(1);
    // promptsPresented is deferred until breathing ends
    expect(result.promptState.promptsPresented).toBe(1);
    expect(result.promptState.breathRemainingMs).toBe(tuning.breathGapMs);
  });

  it('returns breathing outcome while breath gap is active', () => {
    const tuning = buildGameplayTuning('easy', {
      promptHoldMs: 500,
      promptCadenceMs: 2_000,
    });
    const sequence = createPromptSequence(['do', 're', 'mi']);
    const promptState = {
      ...createPromptState(sequence),
      currentPrompt: null,
      breathRemainingMs: 500,
      promptsCleared: 1,
    };

    const result = advancePromptState({
      promptState,
      matchState: 'missing',
      elapsedMs: 200,
      tuning,
    });

    expect(result.promptOutcome).toBe('breathing');
    expect(result.currentPrompt).toBeNull();
    expect(result.promptState.breathRemainingMs).toBe(300);
  });

  it('activates the next note and increments promptsPresented when breathing ends', () => {
    const tuning = buildGameplayTuning('normal', {
      promptHoldMs: 500,
      promptCadenceMs: 2_000,
    });
    const sequence = createPromptSequence(['do', 're', 'mi']);
    const promptState = {
      ...createPromptState(sequence),
      currentPrompt: null,
      breathRemainingMs: 100,
      promptsCleared: 1,
    };

    const result = advancePromptState({
      promptState,
      matchState: 'missing',
      elapsedMs: 100,
      tuning,
    });

    // Breathing just ended — next note activated
    expect(result.promptOutcome).toBe('holding');
    expect(result.promptState.currentPrompt?.noteId).toBe('re');
    expect(result.promptState.breathRemainingMs).toBe(0);
    expect(result.promptState.promptsPresented).toBe(2);
  });

  it('consumes leftover frame time after breathing expires mid-frame', () => {
    const tuning = buildGameplayTuning('normal', {
      promptHoldMs: 500,
      promptCadenceMs: 2_000,
    });
    const sequence = createPromptSequence(['do', 're', 'mi']);
    const promptState = {
      ...createPromptState(sequence),
      currentPrompt: null,
      breathRemainingMs: 50,
      promptsCleared: 1,
    };

    const result = advancePromptState({
      promptState,
      matchState: 'correct',
      elapsedMs: 200,
      tuning,
    });

    // 50ms breathing consumed, 150ms applied to the new note
    expect(result.promptOutcome).toBe('holding');
    expect(result.promptState.currentPrompt?.noteId).toBe('re');
    expect(result.promptState.breathRemainingMs).toBe(0);
    expect(result.promptState.promptAgeMs).toBe(150);
    expect(result.promptState.holdProgressMs).toBe(150);
  });

  it('decays hold progress when the player leaves the target note', () => {
    const tuning = buildGameplayTuning('normal', {
      promptHoldMs: 1_000,
      promptDecayMs: 500,
      promptCadenceMs: 2_500,
    });
    const promptState = {
      ...createPromptState(createPromptSequence(['do', 're'])),
      holdProgressMs: 700,
      promptAgeMs: 700,
    };

    const result = advancePromptState({
      promptState,
      matchState: 'incorrect',
      elapsedMs: 250,
      tuning,
    });

    expect(result.promptOutcome).toBe('holding');
    expect(result.promptState.holdProgressMs).toBe(200);
    expect(result.promptState.currentPrompt?.noteId).toBe('do');
  });

  it('enters breathing gap when cadence expires without a clear', () => {
    const tuning = buildGameplayTuning('hard', {
      promptHoldMs: 900,
      promptCadenceMs: 800,
    });
    const promptState = createPromptState(createPromptSequence(['fa', 'sol', 'la']));

    const result = advancePromptState({
      promptState,
      matchState: 'missing',
      elapsedMs: 800,
      tuning,
    });

    expect(result.promptOutcome).toBe('rotated');
    expect(result.previousPrompt?.noteId).toBe('fa');
    // Entering breathing gap — no active note
    expect(result.currentPrompt).toBeNull();
    expect(result.promptState.promptsCleared).toBe(0);
    // promptsPresented deferred until after breathing
    expect(result.promptState.promptsPresented).toBe(1);
    expect(result.promptState.breathRemainingMs).toBe(tuning.breathGapMs);
  });

  it('does not apply breathing gap on the first note', () => {
    const tuning = buildGameplayTuning('easy');
    const promptState = createPromptState(createPromptSequence(['do', 're']));

    expect(promptState.breathRemainingMs).toBe(0);
    expect(promptState.currentPrompt?.noteId).toBe('do');
  });
});
