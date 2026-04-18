import { describe, expect, it } from 'vitest';
import type { DifficultyId } from '@shared/config/difficulty';
import {
  createEmptyDifficultyProgressIndex,
  createEmptyProgressionSnapshot,
  type ProgressionSnapshot,
  type RunResultSummary,
} from './contracts';
import {
  checkNewPersonalBests,
  getCompletionRate,
  getOverallProgressSummary,
  getPersonalBests,
  getProgressSummaryForDifficulty,
  getRecentTrend,
  getRunHistoryForDifficulty,
} from './selectors';

function makeRun(overrides: Partial<RunResultSummary> & { id: string; difficultyId: DifficultyId }): RunResultSummary {
  return {
    recordedAt: '2026-05-01T12:00:00.000Z',
    outcome: 'completed',
    endReason: 'moon-reached',
    score: 500,
    stars: 1,
    durationMs: 60000,
    comparisonGroupId: null,
    hazardsFaced: 0,
    boostsCaught: 0,
    performance: {
      accuracyPercent: 60,
      timeOnTargetMs: 30000,
      longestCorrectStreak: 5,
      promptsCleared: 8,
      promptsPresented: 12,
    },
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<ProgressionSnapshot> = {}): ProgressionSnapshot {
  const base = createEmptyProgressionSnapshot();
  return {
    ...base,
    ...overrides,
    difficultyRecords: {
      ...createEmptyDifficultyProgressIndex(),
      ...overrides.difficultyRecords,
    },
  };
}

describe('getRunHistoryForDifficulty', () => {
  it('filters runs to a specific difficulty', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy' }),
      makeRun({ id: 'r2', difficultyId: 'normal' }),
      makeRun({ id: 'r3', difficultyId: 'easy' }),
    ];
    const filtered = getRunHistoryForDifficulty(runs, 'easy');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.difficultyId === 'easy')).toBe(true);
  });

  it('returns empty array when no runs match', () => {
    const runs = [makeRun({ id: 'r1', difficultyId: 'hard' })];
    expect(getRunHistoryForDifficulty(runs, 'easy')).toHaveLength(0);
  });
});

describe('getCompletionRate', () => {
  it('returns 0 for empty history', () => {
    expect(getCompletionRate([])).toBe(0);
  });

  it('computes percentage of completed runs', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', outcome: 'completed' }),
      makeRun({ id: 'r2', difficultyId: 'easy', outcome: 'failed' }),
      makeRun({ id: 'r3', difficultyId: 'easy', outcome: 'completed' }),
      makeRun({ id: 'r4', difficultyId: 'easy', outcome: 'abandoned' }),
    ];
    expect(getCompletionRate(runs)).toBe(50);
  });

  it('filters by difficulty when specified', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', outcome: 'completed' }),
      makeRun({ id: 'r2', difficultyId: 'normal', outcome: 'failed' }),
    ];
    expect(getCompletionRate(runs, 'easy')).toBe(100);
    expect(getCompletionRate(runs, 'normal')).toBe(0);
  });
});

describe('getRecentTrend', () => {
  it('returns insufficient-data for fewer than 3 runs', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', score: 100 }),
      makeRun({ id: 'r2', difficultyId: 'easy', score: 200 }),
    ];
    expect(getRecentTrend(runs)).toBe('insufficient-data');
  });

  it('returns improving when newer runs score higher', () => {
    // runHistory is newest-first
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', score: 900 }),
      makeRun({ id: 'r2', difficultyId: 'easy', score: 800 }),
      makeRun({ id: 'r3', difficultyId: 'easy', score: 200 }),
      makeRun({ id: 'r4', difficultyId: 'easy', score: 100 }),
    ];
    expect(getRecentTrend(runs)).toBe('improving');
  });

  it('returns declining when newer runs score lower', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', score: 100 }),
      makeRun({ id: 'r2', difficultyId: 'easy', score: 200 }),
      makeRun({ id: 'r3', difficultyId: 'easy', score: 800 }),
      makeRun({ id: 'r4', difficultyId: 'easy', score: 900 }),
    ];
    expect(getRecentTrend(runs)).toBe('declining');
  });

  it('returns stable when scores are equal', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', score: 500 }),
      makeRun({ id: 'r2', difficultyId: 'easy', score: 500 }),
      makeRun({ id: 'r3', difficultyId: 'easy', score: 500 }),
      makeRun({ id: 'r4', difficultyId: 'easy', score: 500 }),
    ];
    expect(getRecentTrend(runs)).toBe('stable');
  });

  it('filters by difficulty when specified', () => {
    const runs = [
      makeRun({ id: 'r1', difficultyId: 'easy', score: 900 }),
      makeRun({ id: 'r2', difficultyId: 'normal', score: 100 }),
      makeRun({ id: 'r3', difficultyId: 'easy', score: 800 }),
      makeRun({ id: 'r4', difficultyId: 'easy', score: 200 }),
    ];
    expect(getRecentTrend(runs, 'easy')).toBe('improving');
  });
});

describe('getPersonalBests', () => {
  it('returns null values for difficulties with no runs', () => {
    const snapshot = makeSnapshot();
    const bests = getPersonalBests(snapshot);
    expect(bests.easy.bestScore).toBeNull();
    expect(bests.normal.bestScore).toBeNull();
    expect(bests.hard.bestScore).toBeNull();
  });

  it('computes correct bests per difficulty', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy', score: 300, durationMs: 60000, outcome: 'completed', performance: { accuracyPercent: 70, timeOnTargetMs: 30000, longestCorrectStreak: 8, promptsCleared: 8, promptsPresented: 12 } }),
        makeRun({ id: 'r2', difficultyId: 'easy', score: 600, durationMs: 50000, outcome: 'completed', performance: { accuracyPercent: 80, timeOnTargetMs: 40000, longestCorrectStreak: 12, promptsCleared: 10, promptsPresented: 12 } }),
        makeRun({ id: 'r3', difficultyId: 'normal', score: 1000, durationMs: 90000, outcome: 'failed', performance: { accuracyPercent: 50, timeOnTargetMs: 20000, longestCorrectStreak: 3, promptsCleared: 6, promptsPresented: 12 } }),
      ],
    });
    const bests = getPersonalBests(snapshot);
    expect(bests.easy.bestScore).toBe(600);
    expect(bests.easy.bestAccuracyPercent).toBe(80);
    expect(bests.easy.bestStreak).toBe(12);
    expect(bests.easy.fastestCompletionMs).toBe(50000);
    expect(bests.normal.bestScore).toBe(1000);
    expect(bests.normal.fastestCompletionMs).toBeNull(); // failed run doesn't count
  });
});

describe('getProgressSummaryForDifficulty', () => {
  it('returns zeros and nulls for difficulty with no runs', () => {
    const snapshot = makeSnapshot();
    const summary = getProgressSummaryForDifficulty('hard', snapshot);
    expect(summary.totalRuns).toBe(0);
    expect(summary.completedRuns).toBe(0);
    expect(summary.bestScore).toBeNull();
    expect(summary.completionRatePercent).toBe(0);
    expect(summary.milestones).toHaveLength(0);
  });

  it('computes summary with runs and milestones', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy', score: 800, outcome: 'completed' }),
        makeRun({ id: 'r2', difficultyId: 'easy', score: 200, outcome: 'failed' }),
      ],
      difficultyRecords: {
        ...createEmptyDifficultyProgressIndex(),
        easy: {
          ...createEmptyDifficultyProgressIndex().easy,
          bestScore: 800,
          bestStars: 2,
          bestAccuracyPercent: 70,
          runCount: 2,
          completedRunCount: 1,
        },
      },
      milestones: [
        { id: 'completed-easy', kind: 'difficulty', difficultyId: 'easy', achievedAt: '2026-05-01T12:00:00.000Z' },
        { id: 'first-run', kind: 'participation', difficultyId: 'global', achievedAt: '2026-05-01T12:00:00.000Z' },
      ],
    });
    const summary = getProgressSummaryForDifficulty('easy', snapshot);
    expect(summary.totalRuns).toBe(2);
    expect(summary.completedRuns).toBe(1);
    expect(summary.bestScore).toBe(800);
    expect(summary.completionRatePercent).toBe(50);
    expect(summary.milestones).toHaveLength(1); // only 'easy' scoped milestone
    expect(summary.milestones[0]?.id).toBe('completed-easy');
  });
});

describe('getOverallProgressSummary', () => {
  it('returns zeros for empty snapshot', () => {
    const snapshot = makeSnapshot();
    const summary = getOverallProgressSummary(snapshot);
    expect(summary.totalRuns).toBe(0);
    expect(summary.totalMilestones).toBe(0);
    expect(summary.favoriteDifficulty).toBeNull();
    expect(summary.globalBestScore).toBeNull();
  });

  it('computes correct overall stats', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy', score: 800 }),
        makeRun({ id: 'r2', difficultyId: 'easy', score: 600 }),
        makeRun({ id: 'r3', difficultyId: 'normal', score: 1200 }),
      ],
      difficultyRecords: {
        ...createEmptyDifficultyProgressIndex(),
        easy: { ...createEmptyDifficultyProgressIndex().easy, runCount: 2, bestScore: 800 },
        normal: { ...createEmptyDifficultyProgressIndex().normal, runCount: 1, bestScore: 1200 },
      },
      milestones: [
        { id: 'first-run', kind: 'participation', difficultyId: 'global', achievedAt: '2026-05-01T12:00:00.000Z' },
        { id: 'score-over-1000', kind: 'performance', difficultyId: 'global', achievedAt: '2026-05-01T12:00:00.000Z' },
      ],
    });
    const summary = getOverallProgressSummary(snapshot);
    expect(summary.totalRuns).toBe(3);
    expect(summary.totalMilestones).toBe(2);
    expect(summary.favoriteDifficulty).toBe('easy');
    expect(summary.globalBestScore).toBe(1200);
  });
});

describe('checkNewPersonalBests', () => {
  it('all bests are true for first run on a difficulty', () => {
    const run = makeRun({ id: 'r1', difficultyId: 'easy', score: 500 });
    const snapshot = makeSnapshot({ runHistory: [] });
    const bests = checkNewPersonalBests(run, snapshot);
    expect(bests.isNewBestScore).toBe(true);
    expect(bests.isNewBestAccuracy).toBe(true);
    expect(bests.isNewBestStreak).toBe(true);
  });

  it('detects new best score', () => {
    const run = makeRun({ id: 'r2', difficultyId: 'easy', score: 1000 });
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 500 })],
    });
    expect(checkNewPersonalBests(run, snapshot).isNewBestScore).toBe(true);
  });

  it('returns false for score when not beaten', () => {
    const run = makeRun({ id: 'r2', difficultyId: 'easy', score: 300 });
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 500 })],
    });
    expect(checkNewPersonalBests(run, snapshot).isNewBestScore).toBe(false);
  });

  it('detects new best accuracy', () => {
    const run = makeRun({
      id: 'r2',
      difficultyId: 'easy',
      performance: {
        accuracyPercent: 95,
        timeOnTargetMs: 30000,
        longestCorrectStreak: 5,
        promptsCleared: 8,
        promptsPresented: 12,
      },
    });
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy' })],
    });
    expect(checkNewPersonalBests(run, snapshot).isNewBestAccuracy).toBe(true);
  });

  it('detects new best streak', () => {
    const run = makeRun({
      id: 'r2',
      difficultyId: 'easy',
      performance: {
        accuracyPercent: 60,
        timeOnTargetMs: 30000,
        longestCorrectStreak: 20,
        promptsCleared: 8,
        promptsPresented: 12,
      },
    });
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy' })],
    });
    expect(checkNewPersonalBests(run, snapshot).isNewBestStreak).toBe(true);
  });

  it('ignores runs on different difficulties', () => {
    const run = makeRun({ id: 'r2', difficultyId: 'normal', score: 100 });
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 9999 })],
    });
    // First run on normal = all bests
    expect(checkNewPersonalBests(run, snapshot).isNewBestScore).toBe(true);
  });
});
