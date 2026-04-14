import {
  createEmptyDifficultyProgressIndex,
  createEmptyProgressionSnapshot,
  MAX_RUN_HISTORY_ENTRIES,
  MAX_STAR_RATING,
  type DifficultyProgressRecord,
  type ProgressMilestoneKind,
  type ProgressMilestoneRecord,
  type ProgressionSnapshot,
  type RunOutcome,
  type RunPerformanceMetrics,
  type RunResultSummary,
} from '@features/progression';
import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_IDS,
  isDifficultyId,
  type DifficultyId,
} from '@shared/config/difficulty';
import { readJsonFromStorage, writeJsonToStorage, type StorageIssueCode } from './storage';

export const VIBEN_LOCAL_SAVE_KEY = 'viben:progression';
export const VIBEN_LOCAL_SAVE_VERSION = 1 as const;

export type ProgressionStorageIssue = StorageIssueCode | 'invalid-schema';
export type ProgressionLoadStatus = 'empty' | 'loaded' | 'recovered';

export interface VibenLocalSave extends ProgressionSnapshot {
  version: typeof VIBEN_LOCAL_SAVE_VERSION;
}

export interface ProgressionPersistenceSnapshot {
  save: VibenLocalSave;
  status: ProgressionLoadStatus;
  issues: ReadonlyArray<ProgressionStorageIssue>;
}

interface DifficultyProgressSeed {
  isUnlocked?: boolean;
  unlockedAt?: string | null;
}

function createDefaultSave(): VibenLocalSave {
  return {
    version: VIBEN_LOCAL_SAVE_VERSION,
    ...createEmptyProgressionSnapshot(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function coerceNonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function coerceNullableNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return coerceNonNegativeNumber(value);
}

function coerceNullablePercentage(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function coerceNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function coerceRunOutcome(value: unknown): RunOutcome | null {
  return value === 'completed' || value === 'failed' || value === 'abandoned' ? value : null;
}

function coerceMilestoneKind(value: unknown): ProgressMilestoneKind | null {
  return value === 'participation' || value === 'performance' || value === 'difficulty'
    ? value
    : null;
}

function coercePerformanceMetrics(value: unknown): RunPerformanceMetrics | null {
  if (!isObject(value)) {
    return null;
  }

  return {
    accuracyPercent: coerceNullablePercentage(value.accuracyPercent),
    timeOnTargetMs: coerceNullableNonNegativeNumber(value.timeOnTargetMs),
    longestCorrectStreak: coerceNullableNonNegativeNumber(value.longestCorrectStreak),
    promptsCleared: coerceNullableNonNegativeNumber(value.promptsCleared),
    promptsPresented: coerceNullableNonNegativeNumber(value.promptsPresented),
  };
}

function coerceRunResultSummary(value: unknown): RunResultSummary | null {
  if (!isObject(value)) {
    return null;
  }

  const id = coerceNullableString(value.id);
  const recordedAt = isIsoTimestamp(value.recordedAt) ? value.recordedAt : null;
  const difficultyId = isDifficultyId(value.difficultyId) ? value.difficultyId : null;
  const outcome = coerceRunOutcome(value.outcome);
  const endReason = coerceNullableString(value.endReason);
  const score = coerceNonNegativeNumber(value.score);
  const stars = coerceNonNegativeNumber(value.stars);
  const durationMs = coerceNonNegativeNumber(value.durationMs);
  const hazardsFaced = coerceNonNegativeNumber(value.hazardsFaced) ?? 0;
  const boostsCaught = coerceNonNegativeNumber(value.boostsCaught) ?? 0;
  const performance = coercePerformanceMetrics(value.performance);

  if (
    !id ||
    !recordedAt ||
    !difficultyId ||
    !outcome ||
    score === null ||
    stars === null ||
    stars > MAX_STAR_RATING ||
    durationMs === null ||
    !performance
  ) {
    return null;
  }

  return {
    id,
    recordedAt,
    difficultyId,
    outcome,
    endReason,
    score,
    stars,
    durationMs,
    comparisonGroupId: coerceNullableString(value.comparisonGroupId),
    hazardsFaced,
    boostsCaught,
    performance,
  };
}

function coerceMilestoneRecord(value: unknown): ProgressMilestoneRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const id = coerceNullableString(value.id);
  const kind = coerceMilestoneKind(value.kind);
  const achievedAt = isIsoTimestamp(value.achievedAt) ? value.achievedAt : null;
  const difficultyId =
    value.difficultyId === 'global' || isDifficultyId(value.difficultyId)
      ? value.difficultyId
      : null;

  if (!id || !kind || !achievedAt || !difficultyId) {
    return null;
  }

  return {
    id,
    kind,
    achievedAt,
    difficultyId,
  };
}

function coerceDifficultyProgressSeeds(value: unknown): Partial<Record<DifficultyId, DifficultyProgressSeed>> {
  if (!isObject(value)) {
    return {};
  }

  return DIFFICULTY_IDS.reduce<Partial<Record<DifficultyId, DifficultyProgressSeed>>>(
    (accumulator, difficultyId) => {
      const candidate = value[difficultyId];

      if (!isObject(candidate)) {
        return accumulator;
      }

      accumulator[difficultyId] = {
        isUnlocked: typeof candidate.isUnlocked === 'boolean' ? candidate.isUnlocked : undefined,
        unlockedAt: isIsoTimestamp(candidate.unlockedAt) ? candidate.unlockedAt : null,
      };

      return accumulator;
    },
    {},
  );
}

function buildDifficultyRecords(
  runHistory: ReadonlyArray<RunResultSummary>,
  seeds: Partial<Record<DifficultyId, DifficultyProgressSeed>> = {},
): Record<DifficultyId, DifficultyProgressRecord> {
  const records = createEmptyDifficultyProgressIndex();

  for (const difficultyId of DIFFICULTY_IDS) {
    records[difficultyId] = {
      ...records[difficultyId],
      isUnlocked: seeds[difficultyId]?.isUnlocked ?? true,
      unlockedAt: seeds[difficultyId]?.unlockedAt ?? null,
    };
  }

  for (const run of runHistory) {
    const record = records[run.difficultyId];

    record.runCount += 1;
    record.completedRunCount += run.outcome === 'completed' ? 1 : 0;
    record.bestScore = record.bestScore === null ? run.score : Math.max(record.bestScore, run.score);
    record.bestStars = record.bestStars === null ? run.stars : Math.max(record.bestStars, run.stars);
    record.bestAccuracyPercent =
      run.performance.accuracyPercent === null
        ? record.bestAccuracyPercent
        : record.bestAccuracyPercent === null
          ? run.performance.accuracyPercent
          : Math.max(record.bestAccuracyPercent, run.performance.accuracyPercent);
    record.bestTimeOnTargetMs =
      run.performance.timeOnTargetMs === null
        ? record.bestTimeOnTargetMs
        : record.bestTimeOnTargetMs === null
          ? run.performance.timeOnTargetMs
          : Math.max(record.bestTimeOnTargetMs, run.performance.timeOnTargetMs);
    record.lastPlayedAt =
      record.lastPlayedAt === null || Date.parse(run.recordedAt) > Date.parse(record.lastPlayedAt)
        ? run.recordedAt
        : record.lastPlayedAt;
  }

  return records;
}

function normalizeSave(candidate: unknown): ProgressionPersistenceSnapshot {
  if (!isObject(candidate)) {
    return {
      save: createDefaultSave(),
      status: 'recovered',
      issues: ['invalid-schema'],
    };
  }

  const issues: ProgressionStorageIssue[] = [];

  if (candidate.version !== undefined && candidate.version !== VIBEN_LOCAL_SAVE_VERSION) {
    issues.push('invalid-schema');
  }

  const selectedDifficultyId = isDifficultyId(candidate.selectedDifficultyId)
    ? candidate.selectedDifficultyId
    : DEFAULT_DIFFICULTY_ID;

  if (candidate.selectedDifficultyId !== undefined && !isDifficultyId(candidate.selectedDifficultyId)) {
    issues.push('invalid-schema');
  }

  const runCandidates = Array.isArray(candidate.runHistory) ? candidate.runHistory : [];
  const runHistory = runCandidates
    .map((run) => coerceRunResultSummary(run))
    .filter((run): run is RunResultSummary => run !== null)
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
    .slice(0, MAX_RUN_HISTORY_ENTRIES);

  if (candidate.runHistory !== undefined && runHistory.length !== runCandidates.length) {
    issues.push('invalid-schema');
  }

  const milestoneCandidates = Array.isArray(candidate.milestones) ? candidate.milestones : [];
  const milestones = milestoneCandidates
    .map((milestone) => coerceMilestoneRecord(milestone))
    .filter((milestone): milestone is ProgressMilestoneRecord => milestone !== null);

  if (candidate.milestones !== undefined && milestones.length !== milestoneCandidates.length) {
    issues.push('invalid-schema');
  }

  const difficultySeeds = coerceDifficultyProgressSeeds(candidate.difficultyRecords);
  const lastUpdatedAt = isIsoTimestamp(candidate.lastUpdatedAt) ? candidate.lastUpdatedAt : null;

  if (
    candidate.lastUpdatedAt !== undefined &&
    candidate.lastUpdatedAt !== null &&
    !isIsoTimestamp(candidate.lastUpdatedAt)
  ) {
    issues.push('invalid-schema');
  }

  const save: VibenLocalSave = {
    version: VIBEN_LOCAL_SAVE_VERSION,
    selectedDifficultyId,
    lastUpdatedAt,
    runHistory,
    difficultyRecords: buildDifficultyRecords(runHistory, difficultySeeds),
    milestones,
  };

  return {
    save,
    status: issues.length > 0 ? 'recovered' : 'loaded',
    issues: [...new Set(issues)],
  };
}

function persistSnapshot(
  save: VibenLocalSave,
  storage?: Storage | null,
): ProgressionPersistenceSnapshot {
  const issue = writeJsonToStorage(VIBEN_LOCAL_SAVE_KEY, save, storage);

  if (!issue) {
    return {
      save,
      status: 'loaded',
      issues: [],
    };
  }

  return {
    save,
    status: 'recovered',
    issues: [issue],
  };
}

function withTimestamp(save: VibenLocalSave, timestamp: string): VibenLocalSave {
  return {
    ...save,
    lastUpdatedAt: timestamp,
  };
}

export function createDefaultVibenSave(): VibenLocalSave {
  return createDefaultSave();
}

export function loadProgressionState(storage?: Storage | null): ProgressionPersistenceSnapshot {
  const readResult = readJsonFromStorage(VIBEN_LOCAL_SAVE_KEY, storage);

  if (readResult.issue === 'storage-unavailable') {
    return {
      save: createDefaultSave(),
      status: 'recovered',
      issues: ['storage-unavailable'],
    };
  }

  if (readResult.issue === 'invalid-json') {
    return {
      save: createDefaultSave(),
      status: 'recovered',
      issues: ['invalid-json'],
    };
  }

  if (!readResult.hasStoredValue) {
    return {
      save: createDefaultSave(),
      status: 'empty',
      issues: [],
    };
  }

  return normalizeSave(readResult.value);
}

export function saveProgressionState(
  snapshot: ProgressionSnapshot,
  storage?: Storage | null,
): ProgressionPersistenceSnapshot {
  const normalized = normalizeSave({
    ...snapshot,
    version: VIBEN_LOCAL_SAVE_VERSION,
  });

  return persistSnapshot(normalized.save, storage);
}

export function persistSelectedDifficulty(
  difficultyId: DifficultyId,
  storage?: Storage | null,
): ProgressionPersistenceSnapshot {
  const current = loadProgressionState(storage).save;
  const timestamp = new Date().toISOString();

  return persistSnapshot(
    withTimestamp(
      {
        ...current,
        selectedDifficultyId: difficultyId,
      },
      timestamp,
    ),
    storage,
  );
}

export function persistRunSummary(
  runSummary: RunResultSummary,
  storage?: Storage | null,
): ProgressionPersistenceSnapshot {
  const sanitizedRunSummary = coerceRunResultSummary(runSummary);

  if (!sanitizedRunSummary) {
    const current = loadProgressionState(storage).save;

    return {
      save: current,
      status: 'recovered',
      issues: ['invalid-schema'],
    };
  }

  const current = loadProgressionState(storage).save;
  const nextRunHistory = [sanitizedRunSummary, ...current.runHistory.filter((run) => run.id !== sanitizedRunSummary.id)]
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
    .slice(0, MAX_RUN_HISTORY_ENTRIES);

  const nextSave: VibenLocalSave = {
    ...current,
    selectedDifficultyId: sanitizedRunSummary.difficultyId,
    lastUpdatedAt: sanitizedRunSummary.recordedAt,
    runHistory: nextRunHistory,
    difficultyRecords: buildDifficultyRecords(nextRunHistory, current.difficultyRecords),
  };

  return persistSnapshot(nextSave, storage);
}
