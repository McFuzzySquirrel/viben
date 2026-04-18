import {
  getDifficultyDefinition,
  type DifficultyId,
  type DifficultyTuningConfig,
} from '@shared/config/difficulty';
import type {
  GameplayEventDefinition,
  GameplayMetrics,
  GameplayTuning,
  RocketState,
} from './contracts';

const BASE_GAMEPLAY_TUNING: Omit<GameplayTuning, keyof DifficultyTuningConfig | 'difficultyId'> = {
  targetAltitude: 1000,
  promptHoldMs: 1400,
  promptDecayMs: 900,
  maxStability: 100,
  startingStability: 80,
  correctAltitudePerSecond: 120,
  incorrectAltitudePenaltyPerSecond: 75,
  missingAltitudePenaltyPerSecond: 80,
  correctStabilityPerSecond: 20,
  incorrectStabilityPenaltyPerSecond: 24,
  missingStabilityPenaltyPerSecond: 22,
  boostAltitudePerSecond: 85,
  hazardAltitudePenaltyPerSecond: 70,
  boostStabilityPerSecond: 10,
  hazardStabilityPenaltyPerSecond: 18,
  criticalStabilityThreshold: 20,
  completionBonus: 1000,
};

/**
 * Difficulty-specific overrides applied on top of BASE_GAMEPLAY_TUNING.
 *
 * Easy mode is significantly more forgiving — full starting stability,
 * halved penalties, and faster recovery give casual players ~12 seconds
 * of silence before failure instead of ~3.5 seconds.
 */
function getDifficultyGameplayOverrides(
  difficultyId: DifficultyId,
): Partial<Omit<GameplayTuning, keyof DifficultyTuningConfig | 'difficultyId'>> {
  switch (difficultyId) {
    case 'easy':
      return {
        startingStability: 100,
        correctStabilityPerSecond: 25,
        incorrectStabilityPenaltyPerSecond: 10,
        missingStabilityPenaltyPerSecond: 8,
        incorrectAltitudePenaltyPerSecond: 30,
        missingAltitudePenaltyPerSecond: 35,
        hazardStabilityPenaltyPerSecond: 8,
        hazardAltitudePenaltyPerSecond: 30,
        criticalStabilityThreshold: 15,
      };
    case 'hard':
      return {
        startingStability: 70,
        correctStabilityPerSecond: 16,
        incorrectStabilityPenaltyPerSecond: 28,
        missingStabilityPenaltyPerSecond: 26,
      };
    default:
      return {};
  }
}

export const DEFAULT_HAZARD_ID = 'asteroid-drift';
export const SOLAR_FLARE_HAZARD_ID = 'solar-flare';
export const GRAVITY_WELL_HAZARD_ID = 'gravity-well';
export const DEFAULT_BOOST_ID = 'starlight-burst';
export const NEBULA_SHIELD_BOOST_ID = 'nebula-shield';

export function buildGameplayTuning(
  difficultyId: DifficultyId,
  overrides: Partial<GameplayTuning> = {},
): GameplayTuning {
  const definition = getDifficultyDefinition(difficultyId);

  return {
    difficultyId,
    ...definition.tuning,
    ...BASE_GAMEPLAY_TUNING,
    ...getDifficultyGameplayOverrides(difficultyId),
    ...overrides,
  };
}

/**
 * Returns difficulty-based scaling factors for event catalogs.
 * Easy mode softens hazards and extends boosts; Hard mode intensifies them.
 */
function getDifficultyEventScaling(difficultyId: DifficultyId): {
  hazardDurationScale: number;
  hazardPenaltyScale: number;
  boostDurationScale: number;
} {
  switch (difficultyId) {
    case 'easy':
      return {
        hazardDurationScale: 0.8,
        hazardPenaltyScale: 0.85,
        boostDurationScale: 1.15,
      };
    case 'hard':
      return {
        hazardDurationScale: 1.15,
        hazardPenaltyScale: 1.1,
        boostDurationScale: 0.9,
      };
    default:
      return {
        hazardDurationScale: 1,
        hazardPenaltyScale: 1,
        boostDurationScale: 1,
      };
  }
}

export function createHazardCatalog(
  tuning: GameplayTuning,
): ReadonlyArray<GameplayEventDefinition> {
  const scaling = getDifficultyEventScaling(tuning.difficultyId);

  return [
    {
      id: DEFAULT_HAZARD_ID,
      kind: 'hazard',
      label: 'Asteroid Drift',
      cadenceMs: tuning.hazardCadenceMs,
      durationMs: Math.round(2200 * scaling.hazardDurationScale),
      altitudePerSecond: -tuning.hazardAltitudePenaltyPerSecond * scaling.hazardPenaltyScale,
      stabilityPerSecond: -tuning.hazardStabilityPenaltyPerSecond * scaling.hazardPenaltyScale,
      scoreDelta: 0,
    },
    {
      id: SOLAR_FLARE_HAZARD_ID,
      kind: 'hazard',
      label: 'Solar Flare',
      cadenceMs: Math.round(tuning.hazardCadenceMs * 1.4),
      durationMs: Math.round(1500 * scaling.hazardDurationScale),
      altitudePerSecond: -tuning.hazardAltitudePenaltyPerSecond * 0.5 * scaling.hazardPenaltyScale,
      stabilityPerSecond: -tuning.hazardStabilityPenaltyPerSecond * 1.6 * scaling.hazardPenaltyScale,
      scoreDelta: 0,
      firstAppearanceMs: 15_000,
    },
    {
      id: GRAVITY_WELL_HAZARD_ID,
      kind: 'hazard',
      label: 'Gravity Well',
      cadenceMs: Math.round(tuning.hazardCadenceMs * 2),
      durationMs: Math.round(3000 * scaling.hazardDurationScale),
      altitudePerSecond: -tuning.hazardAltitudePenaltyPerSecond * 1.4 * scaling.hazardPenaltyScale,
      stabilityPerSecond: -tuning.hazardStabilityPenaltyPerSecond * 0.7 * scaling.hazardPenaltyScale,
      scoreDelta: 0,
      firstAppearanceMs: 30_000,
    },
  ];
}

export function createBoostCatalog(
  tuning: GameplayTuning,
): ReadonlyArray<GameplayEventDefinition> {
  const scaling = getDifficultyEventScaling(tuning.difficultyId);

  return [
    {
      id: DEFAULT_BOOST_ID,
      kind: 'boost',
      label: 'Starlight Burst',
      cadenceMs: tuning.boostCadenceMs,
      durationMs: Math.round(1800 * scaling.boostDurationScale),
      altitudePerSecond: tuning.boostAltitudePerSecond,
      stabilityPerSecond: tuning.boostStabilityPerSecond,
      scoreDelta: Math.round(65 * tuning.scoreMultiplier),
    },
    {
      id: NEBULA_SHIELD_BOOST_ID,
      kind: 'boost',
      label: 'Nebula Shield',
      cadenceMs: Math.round(tuning.boostCadenceMs * 1.5),
      durationMs: Math.round(2000 * scaling.boostDurationScale),
      altitudePerSecond: 30,
      stabilityPerSecond: 15,
      scoreDelta: Math.round(40 * tuning.scoreMultiplier),
    },
  ];
}

export function createInitialRocketState(tuning: GameplayTuning): RocketState {
  return {
    altitude: 0,
    velocity: 0,
    stability: tuning.startingStability,
    thrust: 0,
    mode: 'steady',
  };
}

export function createInitialGameplayMetrics(
  initialStability = Number.POSITIVE_INFINITY,
): GameplayMetrics {
  return {
    correctMs: 0,
    incorrectMs: 0,
    missingMs: 0,
    longestCorrectStreakMs: 0,
    currentCorrectStreakMs: 0,
    hazardsTriggered: 0,
    boostsTriggered: 0,
    peakAltitude: 0,
    lowestStability: initialStability,
  };
}
