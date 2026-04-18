import { DIFFICULTY_IDS, type DifficultyId } from '@shared/config/difficulty';
import type {
  LocalRunComparison,
  LocalRunComparisonEntry,
  ProgressMilestoneRecord,
  ProgressionSnapshot,
  RunResultSummary,
} from './contracts';
import { getMilestoneDefinition } from './milestones';

export interface LocalRunComparisonOptions {
  difficultyId?: DifficultyId;
  limit?: number;
}

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient-data';

export interface PersonalBestEntry {
  bestScore: number | null;
  bestAccuracyPercent: number | null;
  bestStreak: number | null;
  fastestCompletionMs: number | null;
}

export interface DifficultyProgressSummary {
  difficultyId: DifficultyId;
  totalRuns: number;
  completedRuns: number;
  bestScore: number | null;
  bestStars: number | null;
  bestAccuracyPercent: number | null;
  completionRatePercent: number;
  milestones: ReadonlyArray<ProgressMilestoneRecord>;
}

export interface OverallProgressSummary {
  totalRuns: number;
  totalMilestones: number;
  favoriteDifficulty: DifficultyId | null;
  globalBestScore: number | null;
}

export function getLatestRunSummary(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId?: DifficultyId,
): RunResultSummary | null {
  return filterRunHistory(runHistory, difficultyId)[0] ?? null;
}

export function getBestRunSummary(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId?: DifficultyId,
): RunResultSummary | null {
  return [...filterRunHistory(runHistory, difficultyId)].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (right.stars !== left.stars) {
      return right.stars - left.stars;
    }

    return Date.parse(right.recordedAt) - Date.parse(left.recordedAt);
  })[0] ?? null;
}

export function buildLocalRunComparison(
  runHistory: ReadonlyArray<RunResultSummary>,
  options: LocalRunComparisonOptions = {},
): LocalRunComparison {
  const filteredRuns = filterRunHistory(runHistory, options.difficultyId);
  const entries = (typeof options.limit === 'number' ? filteredRuns.slice(0, options.limit) : filteredRuns).map(
    (run, index, runs) => createComparisonEntry(run, runs[index + 1] ?? null),
  );

  return {
    comparisonGroupId: options.difficultyId ?? entries[0]?.difficultyId ?? null,
    baselineRunId: entries[1]?.runId ?? null,
    entries,
  };
}

function filterRunHistory(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId?: DifficultyId,
) {
  return difficultyId
    ? runHistory.filter((run) => run.difficultyId === difficultyId)
    : [...runHistory];
}

function createComparisonEntry(
  run: RunResultSummary,
  baselineRun: RunResultSummary | null,
): LocalRunComparisonEntry {
  return {
    runId: run.id,
    difficultyId: run.difficultyId,
    outcome: run.outcome,
    recordedAt: run.recordedAt,
    score: run.score,
    scoreDelta: toDelta(run.score, baselineRun?.score ?? null),
    stars: run.stars,
    starsDelta: toDelta(run.stars, baselineRun?.stars ?? null),
    accuracyPercent: run.performance.accuracyPercent,
    accuracyDeltaPercent: toDelta(run.performance.accuracyPercent, baselineRun?.performance.accuracyPercent ?? null),
    timeOnTargetMs: run.performance.timeOnTargetMs,
    timeOnTargetDeltaMs: toDelta(run.performance.timeOnTargetMs, baselineRun?.performance.timeOnTargetMs ?? null),
  };
}

function toDelta(currentValue: number | null, baselineValue: number | null) {
  if (currentValue === null || baselineValue === null) {
    return null;
  }

  return Number((currentValue - baselineValue).toFixed(2));
}

// ---------------------------------------------------------------------------
// Enhanced selectors (Phase 3)
// ---------------------------------------------------------------------------

/**
 * Filter run history to only runs on a specific difficulty.
 */
export function getRunHistoryForDifficulty(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId: DifficultyId,
): ReadonlyArray<RunResultSummary> {
  return runHistory.filter((run) => run.difficultyId === difficultyId);
}

/**
 * Returns the percentage of completed runs out of total runs.
 * Optionally filtered by difficulty. Returns 0 when there are no runs.
 */
export function getCompletionRate(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId?: DifficultyId,
): number {
  const filtered = difficultyId ? filterRunHistory(runHistory, difficultyId) : [...runHistory];

  if (filtered.length === 0) {
    return 0;
  }

  const completed = filtered.filter((r) => r.outcome === 'completed').length;

  return Number(((completed / filtered.length) * 100).toFixed(1));
}

/**
 * Analyses score trend of the last N runs. Returns 'improving' if the
 * last half scores higher on average than the first half, 'declining' if
 * lower, 'stable' if equal, or 'insufficient-data' if fewer than 3 runs.
 */
export function getRecentTrend(
  runHistory: ReadonlyArray<RunResultSummary>,
  difficultyId?: DifficultyId,
  count: number = 6,
): TrendDirection {
  const filtered = difficultyId ? filterRunHistory(runHistory, difficultyId) : [...runHistory];
  const recent = filtered.slice(0, Math.max(count, 3));

  if (recent.length < 3) {
    return 'insufficient-data';
  }

  // runHistory is newest-first; split into newer half and older half
  const midpoint = Math.floor(recent.length / 2);
  const newerHalf = recent.slice(0, midpoint);
  const olderHalf = recent.slice(midpoint);

  const newerAvg = newerHalf.reduce((sum, r) => sum + r.score, 0) / newerHalf.length;
  const olderAvg = olderHalf.reduce((sum, r) => sum + r.score, 0) / olderHalf.length;

  // Use a small threshold (1%) to avoid noise
  const diff = newerAvg - olderAvg;
  const threshold = Math.max(olderAvg * 0.01, 1);

  if (diff > threshold) {
    return 'improving';
  }

  if (diff < -threshold) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Returns personal bests per difficulty: best score, accuracy, streak, and
 * fastest completed run time.
 */
export function getPersonalBests(
  snapshot: ProgressionSnapshot,
): Record<DifficultyId, PersonalBestEntry> {
  const result = {} as Record<DifficultyId, PersonalBestEntry>;

  for (const did of DIFFICULTY_IDS) {
    const runs = getRunHistoryForDifficulty(snapshot.runHistory, did);
    let bestScore: number | null = null;
    let bestAccuracy: number | null = null;
    let bestStreak: number | null = null;
    let fastestCompletion: number | null = null;

    for (const run of runs) {
      if (bestScore === null || run.score > bestScore) {
        bestScore = run.score;
      }

      if (run.performance.accuracyPercent !== null) {
        bestAccuracy = bestAccuracy === null
          ? run.performance.accuracyPercent
          : Math.max(bestAccuracy, run.performance.accuracyPercent);
      }

      if (run.performance.longestCorrectStreak !== null) {
        bestStreak = bestStreak === null
          ? run.performance.longestCorrectStreak
          : Math.max(bestStreak, run.performance.longestCorrectStreak);
      }

      if (run.outcome === 'completed') {
        fastestCompletion = fastestCompletion === null
          ? run.durationMs
          : Math.min(fastestCompletion, run.durationMs);
      }
    }

    result[did] = {
      bestScore,
      bestAccuracyPercent: bestAccuracy,
      bestStreak,
      fastestCompletionMs: fastestCompletion,
    };
  }

  return result;
}

/**
 * Returns a rich summary for a single difficulty level, including milestone
 * records scoped to that difficulty (or global milestones).
 */
export function getProgressSummaryForDifficulty(
  difficultyId: DifficultyId,
  snapshot: ProgressionSnapshot,
): DifficultyProgressSummary {
  const runs = getRunHistoryForDifficulty(snapshot.runHistory, difficultyId);
  const completedRuns = runs.filter((r) => r.outcome === 'completed').length;
  const record = snapshot.difficultyRecords[difficultyId];

  const milestones = snapshot.milestones.filter(
    (m) => m.difficultyId === difficultyId,
  );

  return {
    difficultyId,
    totalRuns: runs.length,
    completedRuns,
    bestScore: record?.bestScore ?? null,
    bestStars: record?.bestStars ?? null,
    bestAccuracyPercent: record?.bestAccuracyPercent ?? null,
    completionRatePercent: runs.length > 0 ? Number(((completedRuns / runs.length) * 100).toFixed(1)) : 0,
    milestones,
  };
}

/**
 * Returns an overall progress summary across all difficulties.
 */
export function getOverallProgressSummary(snapshot: ProgressionSnapshot): OverallProgressSummary {
  const totalRuns = snapshot.runHistory.length;
  const totalMilestones = snapshot.milestones.length;

  // Determine favorite difficulty (most played)
  let favoriteDifficulty: DifficultyId | null = null;
  let maxRuns = 0;

  for (const did of DIFFICULTY_IDS) {
    const count = snapshot.difficultyRecords[did]?.runCount ?? 0;

    if (count > maxRuns) {
      maxRuns = count;
      favoriteDifficulty = did;
    }
  }

  // Global best score
  let globalBestScore: number | null = null;

  for (const did of DIFFICULTY_IDS) {
    const best = snapshot.difficultyRecords[did]?.bestScore ?? null;

    if (best !== null && (globalBestScore === null || best > globalBestScore)) {
      globalBestScore = best;
    }
  }

  return {
    totalRuns,
    totalMilestones,
    favoriteDifficulty,
    globalBestScore,
  };
}

/**
 * Checks whether the given run set any personal bests for its difficulty.
 * Returns an object indicating which categories were beaten.
 */
export interface NewPersonalBests {
  isNewBestScore: boolean;
  isNewBestAccuracy: boolean;
  isNewBestStreak: boolean;
}

export function checkNewPersonalBests(
  run: RunResultSummary,
  previousSnapshot: ProgressionSnapshot,
): NewPersonalBests {
  // Look at runs on the same difficulty *excluding* the current run
  const priorRuns = previousSnapshot.runHistory.filter(
    (r) => r.difficultyId === run.difficultyId && r.id !== run.id,
  );

  if (priorRuns.length === 0) {
    // First run on this difficulty — everything is a personal best
    return { isNewBestScore: true, isNewBestAccuracy: run.performance.accuracyPercent !== null, isNewBestStreak: run.performance.longestCorrectStreak !== null };
  }

  let prevBestScore = 0;
  let prevBestAccuracy: number | null = null;
  let prevBestStreak: number | null = null;

  for (const r of priorRuns) {
    if (r.score > prevBestScore) {
      prevBestScore = r.score;
    }

    if (r.performance.accuracyPercent !== null) {
      prevBestAccuracy = prevBestAccuracy === null
        ? r.performance.accuracyPercent
        : Math.max(prevBestAccuracy, r.performance.accuracyPercent);
    }

    if (r.performance.longestCorrectStreak !== null) {
      prevBestStreak = prevBestStreak === null
        ? r.performance.longestCorrectStreak
        : Math.max(prevBestStreak, r.performance.longestCorrectStreak);
    }
  }

  return {
    isNewBestScore: run.score > prevBestScore,
    isNewBestAccuracy:
      run.performance.accuracyPercent !== null &&
      (prevBestAccuracy === null || run.performance.accuracyPercent > prevBestAccuracy),
    isNewBestStreak:
      run.performance.longestCorrectStreak !== null &&
      (prevBestStreak === null || run.performance.longestCorrectStreak > prevBestStreak),
  };
}
