import { describe, expect, it } from 'vitest';
import { buildGameplayTuning } from '../engine';
import { createInitialGameState, gameStateReducer } from './reducer';
import { selectCanStartRun, selectRunHudSnapshot, selectSummaryForProgression } from './selectors';

describe('game state reducer', () => {
  it('transitions setup state into a ready-to-start run contract', () => {
    const initialState = createInitialGameState();
    const setupState = gameStateReducer(initialState, {
      type: 'begin-setup',
      difficultyId: 'hard',
    });
    const readyState = gameStateReducer(setupState, {
      type: 'mark-setup-ready',
    });

    expect(setupState.status).toBe('setup');
    expect(setupState.selectedDifficultyId).toBe('hard');
    expect(selectCanStartRun(readyState)).toBe(true);
  });

  it('moves a completed run into results and exposes progression-safe summary data', () => {
    const tuning = buildGameplayTuning('easy', {
      targetAltitude: 40,
      promptHoldMs: 400,
      correctAltitudePerSecond: 140,
    });
    const readyState = gameStateReducer(
      gameStateReducer(createInitialGameState(), {
        type: 'begin-setup',
      }),
      { type: 'mark-setup-ready' },
    );
    const activeState = gameStateReducer(readyState, {
      type: 'start-run',
      runId: 'run-phase-1',
      startedAtMs: 0,
      startedAtIso: '2026-04-14T00:00:00.000Z',
      tuning,
    });
    const resultsState = gameStateReducer(activeState, {
      type: 'advance-run',
      nowMs: 400,
      elapsedMs: 400,
      recordedAtIso: '2026-04-14T00:00:00.400Z',
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
    });

    expect(resultsState.status).toBe('results');
    if (resultsState.status !== 'results') {
      throw new Error('expected results state');
    }

    expect(resultsState.summary.outcome).toBe('completed');
    expect(resultsState.summary.endReason).toBe('moon-reached');
    expect(selectSummaryForProgression(resultsState)).toEqual({
      id: 'run-phase-1',
      recordedAt: '2026-04-14T00:00:00.400Z',
      difficultyId: 'easy',
      outcome: 'completed',
      endReason: 'moon-reached',
      score: resultsState.summary.score,
      stars: resultsState.summary.stars,
      durationMs: 400,
      comparisonGroupId: null,
      hazardsFaced: resultsState.summary.hazardsTriggered,
      boostsCaught: resultsState.summary.boostsTriggered,
      performance: resultsState.summary.performance,
    });
  });

  it('captures blocked setup as a dedicated shell state', () => {
    const blockedState = gameStateReducer(createInitialGameState(), {
      type: 'block-setup',
      blocker: {
        code: 'microphone-denied',
        source: 'audio',
        recoverable: true,
        detail: 'Browser permission was denied.',
      },
    });

    expect(blockedState.status).toBe('blocked');
    if (blockedState.status !== 'blocked') {
      throw new Error('expected blocked state');
    }

    expect(blockedState.blocker.code).toBe('microphone-denied');
  });

  it('tracks prompt progression, hud output, and hazard counts inside an active run', () => {
    const tuning = buildGameplayTuning('normal', {
      promptHoldMs: 300,
      promptCadenceMs: 900,
      hazardCadenceMs: 300,
      targetAltitude: 1000,
    });
    const activeState = gameStateReducer(
      gameStateReducer(createInitialGameState('normal'), {
        type: 'start-run',
        runId: 'run-loop-active',
        startedAtMs: 0,
        startedAtIso: '2026-04-14T00:00:00.000Z',
        tuning,
      }),
      {
        type: 'advance-run',
        nowMs: 300,
        elapsedMs: 300,
        recordedAtIso: '2026-04-14T00:00:00.300Z',
        audioFrame: {
          sample: null,
          matchState: 'correct',
          targetNoteId: 'do',
        },
      },
    );

    expect(activeState.status).toBe('active');
    if (activeState.status !== 'active') {
      throw new Error('expected active state');
    }

    const hud = selectRunHudSnapshot(activeState);

    expect(activeState.run.promptState.promptsCleared).toBe(1);
    expect(activeState.run.eventHistory[0]?.kind).toBe('hazard');
    expect(activeState.run.metrics.hazardsTriggered).toBe(1);
    expect(hud?.promptsCleared).toBe(1);
    expect(hud?.activeEvent?.kind).toBe('hazard');
  });

  it('produces a failed summary when stability is depleted before the moon is reached', () => {
    const tuning = buildGameplayTuning('hard', {
      startingStability: 10,
      missingStabilityPenaltyPerSecond: 100,
      targetAltitude: 500,
    });
    const activeState = gameStateReducer(createInitialGameState('hard'), {
      type: 'start-run',
      runId: 'run-phase-2-fail',
      startedAtMs: 0,
      startedAtIso: '2026-04-14T00:00:00.000Z',
      tuning,
    });
    const resultsState = gameStateReducer(activeState, {
      type: 'advance-run',
      nowMs: 100,
      elapsedMs: 100,
      recordedAtIso: '2026-04-14T00:00:00.100Z',
      audioFrame: {
        sample: null,
        matchState: 'missing',
        targetNoteId: 'do',
      },
    });

    expect(resultsState.status).toBe('results');
    if (resultsState.status !== 'results') {
      throw new Error('expected results state');
    }

    expect(resultsState.summary.outcome).toBe('failed');
    expect(resultsState.summary.endReason).toBe('stability-depleted');
    expect(resultsState.summary.finalStability).toBe(0);
  });
});
