import { describe, expect, it } from 'vitest';
import { buildGameplayTuning } from '../engine';
import { createInitialGameState, gameStateReducer } from './reducer';
import { selectCanStartRun, selectSummaryForProgression } from './selectors';

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
      score: resultsState.summary.score,
      stars: resultsState.summary.stars,
      durationMs: 400,
      comparisonGroupId: null,
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
});
