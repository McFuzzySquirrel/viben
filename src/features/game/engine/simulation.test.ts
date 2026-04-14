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
      metrics: createInitialGameplayMetrics(tuning.startingStability),
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
      metrics: createInitialGameplayMetrics(tuning.startingStability),
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

  it('fails the run when repeated missing input depletes stability', () => {
    const tuning = buildGameplayTuning('hard', {
      startingStability: 8,
      missingStabilityPenaltyPerSecond: 80,
      targetAltitude: 500,
    });
    const result = resolveGameplayStep({
      elapsedMs: 200,
      elapsedRunMs: 200,
      nowMs: 200,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'missing',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.outcome).toBe('failed');
    expect(result.endReason).toBe('stability-depleted');
    expect(result.rocket.mode).toBe('offline');
  });

  it('starts deterministic boosts when the boost cadence boundary is crossed', () => {
    const tuning = buildGameplayTuning('easy');
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: tuning.boostCadenceMs,
      nowMs: tuning.boostCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.activeEvent?.kind).toBe('boost');
    expect(result.eventHistoryEntry?.kind).toBe('boost');
    expect(result.metrics.boostsTriggered).toBe(1);
    expect(result.scoreDelta).toBeGreaterThan(0);
  });

  it('completes the run when the rocket reaches the moon target altitude', () => {
    const tuning = buildGameplayTuning('easy', {
      targetAltitude: 50,
      correctAltitudePerSecond: 100,
      promptHoldMs: 500,
    });
    const result = resolveGameplayStep({
      elapsedMs: 500,
      elapsedRunMs: 500,
      nowMs: 500,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.outcome).toBe('completed');
    expect(result.endReason).toBe('moon-reached');
    expect(result.rocket.altitude).toBe(tuning.targetAltitude);
    expect(result.scoreDelta).toBeGreaterThanOrEqual(tuning.completionBonus);
  });
});
