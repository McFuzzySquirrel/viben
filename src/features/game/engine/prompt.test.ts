import { describe, expect, it } from 'vitest';
import { advancePromptState, createPromptSequence, createPromptState } from './prompt';
import { buildGameplayTuning } from './tuning';

describe('prompt progression', () => {
  it('clears a prompt after the required correct hold duration', () => {
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
    expect(result.currentPrompt?.noteId).toBe('re');
    expect(result.promptState.promptsCleared).toBe(1);
    expect(result.promptState.promptsPresented).toBe(2);
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

  it('rotates to the next prompt when cadence expires without a clear', () => {
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
    expect(result.currentPrompt?.noteId).toBe('sol');
    expect(result.promptState.promptsCleared).toBe(0);
    expect(result.promptState.promptsPresented).toBe(2);
  });
});
