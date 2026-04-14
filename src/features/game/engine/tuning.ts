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
  startingStability: 72,
  correctAltitudePerSecond: 120,
  incorrectAltitudePenaltyPerSecond: 75,
  missingAltitudePenaltyPerSecond: 95,
  correctStabilityPerSecond: 20,
  incorrectStabilityPenaltyPerSecond: 24,
  missingStabilityPenaltyPerSecond: 28,
  boostAltitudePerSecond: 85,
  hazardAltitudePenaltyPerSecond: 70,
  boostStabilityPerSecond: 10,
  hazardStabilityPenaltyPerSecond: 18,
  criticalStabilityThreshold: 25,
  completionBonus: 750,
};

export const DEFAULT_HAZARD_ID = 'asteroid-drift';
export const DEFAULT_BOOST_ID = 'starlight-burst';

export function buildGameplayTuning(
  difficultyId: DifficultyId,
  overrides: Partial<GameplayTuning> = {},
): GameplayTuning {
  const definition = getDifficultyDefinition(difficultyId);

  return {
    difficultyId,
    ...definition.tuning,
    ...BASE_GAMEPLAY_TUNING,
    ...overrides,
  };
}

export function createHazardCatalog(
  tuning: GameplayTuning,
): ReadonlyArray<GameplayEventDefinition> {
  return [
    {
      id: DEFAULT_HAZARD_ID,
      kind: 'hazard',
      label: 'Asteroid Drift',
      cadenceMs: tuning.hazardCadenceMs,
      durationMs: 2200,
      altitudePerSecond: -tuning.hazardAltitudePenaltyPerSecond,
      stabilityPerSecond: -tuning.hazardStabilityPenaltyPerSecond,
      scoreDelta: 0,
    },
  ];
}

export function createBoostCatalog(
  tuning: GameplayTuning,
): ReadonlyArray<GameplayEventDefinition> {
  return [
    {
      id: DEFAULT_BOOST_ID,
      kind: 'boost',
      label: 'Starlight Burst',
      cadenceMs: tuning.boostCadenceMs,
      durationMs: 1800,
      altitudePerSecond: tuning.boostAltitudePerSecond,
      stabilityPerSecond: tuning.boostStabilityPerSecond,
      scoreDelta: Math.round(65 * tuning.scoreMultiplier),
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
