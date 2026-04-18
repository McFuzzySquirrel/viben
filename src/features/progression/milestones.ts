import { DIFFICULTY_IDS, type DifficultyId } from '@shared/config/difficulty';
import type { ProgressMilestoneKind, ProgressMilestoneRecord, ProgressionSnapshot } from './contracts';

/**
 * Milestone definition — describes a single achievable milestone with its
 * detection predicate. The `check` function is *not* serialized; only the
 * `id`, `kind`, `label`, `description`, and `difficultyId` fields appear in
 * the stored `ProgressMilestoneRecord`.
 */
export interface MilestoneDefinition {
  readonly id: string;
  readonly kind: ProgressMilestoneKind;
  readonly label: string;
  readonly description: string;
  /** The difficulty scope ('global' or a specific DifficultyId). */
  readonly difficultyId: DifficultyId | 'global';
  /** Returns `true` when the milestone should be awarded. */
  readonly check: (snapshot: ProgressionSnapshot) => boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalRunCount(snapshot: ProgressionSnapshot): number {
  return snapshot.runHistory.length;
}

function completedRunCount(snapshot: ProgressionSnapshot): number {
  return snapshot.runHistory.filter((r) => r.outcome === 'completed').length;
}

function hasRunOnDifficulty(snapshot: ProgressionSnapshot, did: DifficultyId): boolean {
  return snapshot.runHistory.some((r) => r.difficultyId === did);
}

function completedRunCountOnDifficulty(snapshot: ProgressionSnapshot, did: DifficultyId): number {
  return snapshot.runHistory.filter((r) => r.difficultyId === did && r.outcome === 'completed').length;
}

function bestStarsOnDifficulty(snapshot: ProgressionSnapshot, did: DifficultyId): number {
  return snapshot.difficultyRecords[did]?.bestStars ?? 0;
}

function bestScoreGlobal(snapshot: ProgressionSnapshot): number {
  let best = 0;
  for (const r of snapshot.runHistory) {
    if (r.score > best) {
      best = r.score;
    }
  }
  return best;
}

function bestAccuracyGlobal(snapshot: ProgressionSnapshot): number | null {
  let best: number | null = null;
  for (const r of snapshot.runHistory) {
    if (r.performance.accuracyPercent !== null) {
      best = best === null ? r.performance.accuracyPercent : Math.max(best, r.performance.accuracyPercent);
    }
  }
  return best;
}

function anyRunHasStars(snapshot: ProgressionSnapshot, minStars: number): boolean {
  return snapshot.runHistory.some((r) => r.stars >= minStars);
}

// ---------------------------------------------------------------------------
// Milestone catalog
// ---------------------------------------------------------------------------

export const MILESTONE_DEFINITIONS: ReadonlyArray<MilestoneDefinition> = [
  // --- Participation milestones ---
  {
    id: 'first-run',
    kind: 'participation',
    label: 'First Run',
    description: 'Completed your first run in any mode.',
    difficultyId: 'global',
    check: (s) => totalRunCount(s) >= 1,
  },
  {
    id: '5-runs-completed',
    kind: 'participation',
    label: '5 Runs Completed',
    description: 'Played 5 total runs across all difficulties.',
    difficultyId: 'global',
    check: (s) => totalRunCount(s) >= 5,
  },
  {
    id: '10-runs-completed',
    kind: 'participation',
    label: '10 Runs Completed',
    description: 'Played 10 total runs across all difficulties.',
    difficultyId: 'global',
    check: (s) => totalRunCount(s) >= 10,
  },
  {
    id: 'first-run-each-difficulty',
    kind: 'participation',
    label: 'First Run on Each Difficulty',
    description: 'Tried every difficulty level at least once.',
    difficultyId: 'global',
    check: (s) => DIFFICULTY_IDS.every((did) => hasRunOnDifficulty(s, did)),
  },

  // --- Performance milestones ---
  {
    id: 'first-3-star-run',
    kind: 'performance',
    label: 'First 3-Star Run',
    description: 'Earned a 3-star rating on any run.',
    difficultyId: 'global',
    check: (s) => anyRunHasStars(s, 3),
  },
  {
    id: 'perfect-accuracy',
    kind: 'performance',
    label: 'Perfect Accuracy',
    description: 'Achieved 100% accuracy on any run.',
    difficultyId: 'global',
    check: (s) => bestAccuracyGlobal(s) === 100,
  },
  {
    id: 'score-over-1000',
    kind: 'performance',
    label: 'Score Over 1000',
    description: 'Scored over 1,000 points in a single run.',
    difficultyId: 'global',
    check: (s) => bestScoreGlobal(s) > 1000,
  },
  {
    id: 'score-over-5000',
    kind: 'performance',
    label: 'Score Over 5000',
    description: 'Scored over 5,000 points in a single run.',
    difficultyId: 'global',
    check: (s) => bestScoreGlobal(s) > 5000,
  },

  // --- Difficulty milestones ---
  {
    id: 'completed-easy',
    kind: 'difficulty',
    label: 'Completed Easy',
    description: 'Finished a run on Easy difficulty.',
    difficultyId: 'easy',
    check: (s) => completedRunCountOnDifficulty(s, 'easy') >= 1,
  },
  {
    id: 'completed-normal',
    kind: 'difficulty',
    label: 'Completed Normal',
    description: 'Finished a run on Normal difficulty.',
    difficultyId: 'normal',
    check: (s) => completedRunCountOnDifficulty(s, 'normal') >= 1,
  },
  {
    id: 'completed-hard',
    kind: 'difficulty',
    label: 'Completed Hard',
    description: 'Finished a run on Hard difficulty.',
    difficultyId: 'hard',
    check: (s) => completedRunCountOnDifficulty(s, 'hard') >= 1,
  },
  {
    id: '3-star-on-hard',
    kind: 'difficulty',
    label: '3-Star on Hard',
    description: 'Earned a 3-star rating on Hard difficulty.',
    difficultyId: 'hard',
    check: (s) => bestStarsOnDifficulty(s, 'hard') >= 3,
  },
];

// ---------------------------------------------------------------------------
// Detection engine
// ---------------------------------------------------------------------------

/**
 * Determines which milestones from the catalog should be newly awarded based
 * on the current progression state. Already-awarded milestones (present in
 * `snapshot.milestones`) are excluded so detection is idempotent.
 *
 * Returns an array of `ProgressMilestoneRecord` objects ready for persistence.
 */
export function detectNewMilestones(snapshot: ProgressionSnapshot): ProgressMilestoneRecord[] {
  const existingIds = new Set(snapshot.milestones.map((m) => m.id));
  const now = new Date().toISOString();

  return MILESTONE_DEFINITIONS.filter((def) => !existingIds.has(def.id) && def.check(snapshot))
    .map((def) => ({
      id: def.id,
      kind: def.kind,
      difficultyId: def.difficultyId,
      achievedAt: now,
    }));
}

/**
 * Returns the full milestone definition for a given milestone id, if it exists
 * in the catalog. Useful for displaying label/description from stored records.
 */
export function getMilestoneDefinition(milestoneId: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find((def) => def.id === milestoneId);
}
