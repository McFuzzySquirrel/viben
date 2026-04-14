import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_IDS,
  type DifficultyId,
} from '@shared/config/difficulty';

export const MAX_STAR_RATING = 3 as const;
export const MAX_RUN_HISTORY_ENTRIES = 50 as const;

export type RunOutcome = 'completed' | 'failed' | 'abandoned';
export type ProgressMilestoneKind = 'participation' | 'performance' | 'difficulty';

export interface RunPerformanceMetrics {
  accuracyPercent: number | null;
  timeOnTargetMs: number | null;
  longestCorrectStreak: number | null;
  promptsCleared: number | null;
  promptsPresented: number | null;
}

export interface RunResultSummary {
  id: string;
  recordedAt: string;
  difficultyId: DifficultyId;
  outcome: RunOutcome;
  score: number;
  stars: number;
  durationMs: number;
  comparisonGroupId: string | null;
  performance: RunPerformanceMetrics;
}

export interface DifficultyProgressRecord {
  difficultyId: DifficultyId;
  isUnlocked: boolean;
  unlockedAt: string | null;
  lastPlayedAt: string | null;
  runCount: number;
  completedRunCount: number;
  bestScore: number | null;
  bestStars: number | null;
  bestAccuracyPercent: number | null;
  bestTimeOnTargetMs: number | null;
}

export interface ProgressMilestoneRecord {
  id: string;
  kind: ProgressMilestoneKind;
  difficultyId: DifficultyId | 'global';
  achievedAt: string;
}

export interface ProgressionSnapshot {
  selectedDifficultyId: DifficultyId;
  lastUpdatedAt: string | null;
  runHistory: ReadonlyArray<RunResultSummary>;
  difficultyRecords: Record<DifficultyId, DifficultyProgressRecord>;
  milestones: ReadonlyArray<ProgressMilestoneRecord>;
}

export interface LocalRunComparisonEntry {
  runId: string;
  difficultyId: DifficultyId;
  outcome: RunOutcome;
  recordedAt: string;
  score: number;
  scoreDelta: number | null;
  stars: number;
  starsDelta: number | null;
  accuracyPercent: number | null;
  accuracyDeltaPercent: number | null;
  timeOnTargetMs: number | null;
  timeOnTargetDeltaMs: number | null;
}

export interface LocalRunComparison {
  comparisonGroupId: string | null;
  baselineRunId: string | null;
  entries: ReadonlyArray<LocalRunComparisonEntry>;
}

export function createEmptyRunPerformanceMetrics(): RunPerformanceMetrics {
  return {
    accuracyPercent: null,
    timeOnTargetMs: null,
    longestCorrectStreak: null,
    promptsCleared: null,
    promptsPresented: null,
  };
}

export function createEmptyDifficultyProgressRecord(
  difficultyId: DifficultyId,
): DifficultyProgressRecord {
  return {
    difficultyId,
    isUnlocked: true,
    unlockedAt: null,
    lastPlayedAt: null,
    runCount: 0,
    completedRunCount: 0,
    bestScore: null,
    bestStars: null,
    bestAccuracyPercent: null,
    bestTimeOnTargetMs: null,
  };
}

export function createEmptyDifficultyProgressIndex(): Record<DifficultyId, DifficultyProgressRecord> {
  return Object.fromEntries(
    DIFFICULTY_IDS.map((difficultyId) => [
      difficultyId,
      createEmptyDifficultyProgressRecord(difficultyId),
    ]),
  ) as Record<DifficultyId, DifficultyProgressRecord>;
}

export function createEmptyProgressionSnapshot(): ProgressionSnapshot {
  return {
    selectedDifficultyId: DEFAULT_DIFFICULTY_ID,
    lastUpdatedAt: null,
    runHistory: [],
    difficultyRecords: createEmptyDifficultyProgressIndex(),
    milestones: [],
  };
}
