import { describe, expect, it } from 'vitest';
import { resolveGameplayStep } from './simulation';
import { createPromptSequence, createPromptState } from './prompt';
import {
  buildGameplayTuning,
  createInitialGameplayMetrics,
  createInitialRocketState,
} from './tuning';

describe('gameplay simulation', () => {
  it('rewards correct matches by clearing prompts and climbing toward the target', () => {
    const tuning = buildGameplayTuning('easy', {
      promptHoldMs: 600,
    });
    const result = resolveGameplayStep({
      elapsedMs: 600,
      elapsedRunMs: 600,
      nowMs: 600,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.didClearPrompt).toBe(true);
    expect(result.promptState.promptsCleared).toBe(1);
    expect(result.rocket.altitude).toBeGreaterThan(0);
    expect(result.rocket.stability).toBeGreaterThan(tuning.startingStability);
    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.outcome).toBe('active');
  });

  it('starts deterministic hazards when the cadence boundary is crossed', () => {
    const tuning = buildGameplayTuning('normal');
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: tuning.hazardCadenceMs,
      nowMs: tuning.hazardCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(),
      audioFrame: {
        sample: null,
        matchState: 'incorrect',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.activeEvent?.kind).toBe('hazard');
    expect(result.eventHistoryEntry?.kind).toBe('hazard');
    expect(result.metrics.hazardsTriggered).toBe(1);
    expect(result.rocket.mode).toBe('drifting');
  });
});
