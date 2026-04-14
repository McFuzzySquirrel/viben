import type { DifficultyId } from '@shared/config/difficulty';
import type { LocalRunComparison, LocalRunComparisonEntry, RunResultSummary } from './contracts';

export interface LocalRunComparisonOptions {
  difficultyId?: DifficultyId;
  limit?: number;
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
