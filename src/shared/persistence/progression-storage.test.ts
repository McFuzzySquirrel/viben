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

  it('SP-06 persists gameplay-only run data without raw audio fields', () => {
    persistRunSummary({
      id: 'run-privacy',
      recordedAt: '2026-04-14T12:05:00.000Z',
      difficultyId: 'easy',
      outcome: 'failed',
      score: 320,
      stars: 1,
      durationMs: 24000,
      comparisonGroupId: null,
      performance: {
        accuracyPercent: 48,
        timeOnTargetMs: 9000,
        longestCorrectStreak: 3,
        promptsCleared: 4,
        promptsPresented: 10,
      },
    });

    const persistedSave = JSON.parse(window.localStorage.getItem(VIBEN_LOCAL_SAVE_KEY) ?? '{}') as Record<
      string,
      unknown
    >;
    const serializedSave = JSON.stringify(persistedSave);

    expect(persistedSave).toMatchObject({
      selectedDifficultyId: 'easy',
      runHistory: [
        expect.objectContaining({
          id: 'run-privacy',
          score: 320,
        }),
      ],
    });
    expect(serializedSave).not.toContain('audioBuffer');
    expect(serializedSave).not.toContain('rawAudio');
    expect(serializedSave).not.toContain('voiceprint');
    expect(serializedSave).not.toContain('microphone');
  });
});
