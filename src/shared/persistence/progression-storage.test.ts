// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DIFFICULTY_ID } from '@shared/config/difficulty';
import {
  loadProgressionState,
  persistRunSummary,
  persistSelectedDifficulty,
  VIBEN_LOCAL_SAVE_KEY,
} from './progression-storage';

describe('progression storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns an empty default save when storage is empty', () => {
    const snapshot = loadProgressionState();

    expect(snapshot.status).toBe('empty');
    expect(snapshot.save.selectedDifficultyId).toBe(DEFAULT_DIFFICULTY_ID);
    expect(snapshot.save.runHistory).toHaveLength(0);
  });

  it('recovers from invalid JSON without throwing', () => {
    window.localStorage.setItem(VIBEN_LOCAL_SAVE_KEY, '{');

    const snapshot = loadProgressionState();

    expect(snapshot.status).toBe('recovered');
    expect(snapshot.issues).toContain('invalid-json');
    expect(snapshot.save.runHistory).toHaveLength(0);
  });

  it('persists selected difficulty across reloads', () => {
    persistSelectedDifficulty('hard');

    const snapshot = loadProgressionState();

    expect(snapshot.save.selectedDifficultyId).toBe('hard');
    expect(snapshot.save.lastUpdatedAt).not.toBeNull();
  });

  it('stores minimized run summaries and recomputes local bests', () => {
    persistRunSummary({
      id: 'run-001',
      recordedAt: '2026-04-14T12:00:00.000Z',
      difficultyId: 'normal',
      outcome: 'completed',
      score: 1280,
      stars: 2,
      durationMs: 96000,
      comparisonGroupId: 'local-group-1',
      performance: {
        accuracyPercent: 82.5,
        timeOnTargetMs: 51000,
        longestCorrectStreak: 9,
        promptsCleared: 18,
        promptsPresented: 22,
      },
    });

    const snapshot = loadProgressionState();
    const [savedRun] = snapshot.save.runHistory;

    expect(snapshot.save.runHistory).toHaveLength(1);
    expect(snapshot.save.difficultyRecords.normal.bestScore).toBe(1280);
    expect(snapshot.save.difficultyRecords.normal.bestAccuracyPercent).toBe(82.5);
    expect(savedRun).toEqual({
      id: 'run-001',
      recordedAt: '2026-04-14T12:00:00.000Z',
      difficultyId: 'normal',
      outcome: 'completed',
      score: 1280,
      stars: 2,
      durationMs: 96000,
      comparisonGroupId: 'local-group-1',
      performance: {
        accuracyPercent: 82.5,
        timeOnTargetMs: 51000,
        longestCorrectStreak: 9,
        promptsCleared: 18,
        promptsPresented: 22,
      },
    });
  });
});
