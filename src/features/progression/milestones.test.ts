import { describe, expect, it } from 'vitest';
import type { DifficultyId } from '@shared/config/difficulty';
import {
  createEmptyDifficultyProgressIndex,
  createEmptyProgressionSnapshot,
  type ProgressionSnapshot,
  type RunResultSummary,
} from './contracts';
import { detectNewMilestones, getMilestoneDefinition, MILESTONE_DEFINITIONS } from './milestones';

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
  return {
    ...createEmptyProgressionSnapshot(),
    ...overrides,
    difficultyRecords: {
      ...createEmptyDifficultyProgressIndex(),
      ...overrides.difficultyRecords,
    },
  };
}

describe('milestone definitions', () => {
  it('has unique IDs for all milestone definitions', () => {
    const ids = MILESTONE_DEFINITIONS.map((d) => d.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('provides valid kind values for all definitions', () => {
    const validKinds = new Set(['participation', 'performance', 'difficulty']);
    for (const def of MILESTONE_DEFINITIONS) {
      expect(validKinds.has(def.kind)).toBe(true);
    }
  });

  it('getMilestoneDefinition returns the matching definition', () => {
    const def = getMilestoneDefinition('first-run');
    expect(def).toBeDefined();
    expect(def?.label).toBe('First Run');
  });

  it('getMilestoneDefinition returns undefined for unknown IDs', () => {
    expect(getMilestoneDefinition('unknown-milestone')).toBeUndefined();
  });
});

describe('detectNewMilestones', () => {
  it('returns empty array for an empty snapshot', () => {
    const snapshot = makeSnapshot();
    const milestones = detectNewMilestones(snapshot);
    expect(milestones).toHaveLength(0);
  });

  it('awards "first-run" after the first run', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy' })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'first-run')).toBeDefined();
  });

  it('does not re-award already-achieved milestones (idempotent)', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy' })],
      milestones: [
        { id: 'first-run', kind: 'participation', difficultyId: 'global', achievedAt: '2026-05-01T12:00:00.000Z' },
      ],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'first-run')).toBeUndefined();
  });

  it('awards "5-runs-completed" when 5 runs exist', () => {
    const runs = Array.from({ length: 5 }, (_, i) =>
      makeRun({ id: `r${i}`, difficultyId: 'easy' }),
    );
    const snapshot = makeSnapshot({ runHistory: runs });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === '5-runs-completed')).toBeDefined();
  });

  it('awards "10-runs-completed" when 10 runs exist', () => {
    const runs = Array.from({ length: 10 }, (_, i) =>
      makeRun({ id: `r${i}`, difficultyId: 'easy' }),
    );
    const snapshot = makeSnapshot({ runHistory: runs });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === '10-runs-completed')).toBeDefined();
  });

  it('awards "first-run-each-difficulty" when all difficulties have been played', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy' }),
        makeRun({ id: 'r2', difficultyId: 'normal' }),
        makeRun({ id: 'r3', difficultyId: 'hard' }),
      ],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'first-run-each-difficulty')).toBeDefined();
  });

  it('does not award "first-run-each-difficulty" when one difficulty is missing', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy' }),
        makeRun({ id: 'r2', difficultyId: 'normal' }),
      ],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'first-run-each-difficulty')).toBeUndefined();
  });

  it('awards "first-3-star-run" when a run has 3 stars', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', stars: 3 })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'first-3-star-run')).toBeDefined();
  });

  it('awards "perfect-accuracy" when a run has 100% accuracy', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({
          id: 'r1',
          difficultyId: 'easy',
          performance: {
            accuracyPercent: 100,
            timeOnTargetMs: 50000,
            longestCorrectStreak: 20,
            promptsCleared: 20,
            promptsPresented: 20,
          },
        }),
      ],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'perfect-accuracy')).toBeDefined();
  });

  it('awards "score-over-1000" when score exceeds 1000', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 1500 })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'score-over-1000')).toBeDefined();
  });

  it('does not award "score-over-1000" when score is exactly 1000', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 1000 })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'score-over-1000')).toBeUndefined();
  });

  it('awards "score-over-5000" when score exceeds 5000', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 6000 })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'score-over-5000')).toBeDefined();
  });

  it('awards "completed-easy" when a completed run exists on easy', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', outcome: 'completed' })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'completed-easy')).toBeDefined();
  });

  it('does not award "completed-easy" for a failed run on easy', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', outcome: 'failed' })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'completed-easy')).toBeUndefined();
  });

  it('awards "completed-hard" for a completed hard run', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'hard', outcome: 'completed' })],
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === 'completed-hard')).toBeDefined();
  });

  it('awards "3-star-on-hard" when hard difficulty best stars is 3', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'hard', stars: 3, outcome: 'completed' })],
      difficultyRecords: {
        ...createEmptyDifficultyProgressIndex(),
        hard: {
          ...createEmptyDifficultyProgressIndex().hard,
          bestStars: 3,
          runCount: 1,
          completedRunCount: 1,
        },
      },
    });
    const milestones = detectNewMilestones(snapshot);
    expect(milestones.find((m) => m.id === '3-star-on-hard')).toBeDefined();
  });

  it('awards multiple milestones in a single detection pass', () => {
    const snapshot = makeSnapshot({
      runHistory: [makeRun({ id: 'r1', difficultyId: 'easy', score: 1500, stars: 3 })],
    });
    const milestones = detectNewMilestones(snapshot);
    const ids = milestones.map((m) => m.id);
    expect(ids).toContain('first-run');
    expect(ids).toContain('first-3-star-run');
    expect(ids).toContain('score-over-1000');
    expect(ids).toContain('completed-easy');
  });

  it('all returned milestone records have valid shape', () => {
    const snapshot = makeSnapshot({
      runHistory: Array.from({ length: 10 }, (_, i) =>
        makeRun({ id: `r${i}`, difficultyId: 'easy', score: 1500, stars: 3 }),
      ),
    });
    const milestones = detectNewMilestones(snapshot);
    for (const m of milestones) {
      expect(typeof m.id).toBe('string');
      expect(['participation', 'performance', 'difficulty']).toContain(m.kind);
      expect(typeof m.achievedAt).toBe('string');
      expect(m.difficultyId).toBeDefined();
    }
  });
});
