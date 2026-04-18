import { describe, expect, it } from 'vitest';
import { DIFFICULTY_IDS, type DifficultyId } from '@shared/config/difficulty';
import {
  buildGameplayTuning,
  createBoostCatalog,
  createHazardCatalog,
  createInitialGameplayMetrics,
  createInitialRocketState,
  DEFAULT_BOOST_ID,
  DEFAULT_HAZARD_ID,
  GRAVITY_WELL_HAZARD_ID,
  NEBULA_SHIELD_BOOST_ID,
  SOLAR_FLARE_HAZARD_ID,
  type GameplayTuning,
} from './tuning';

// ---------------------------------------------------------------------------
// Task 3.5 — Tuning regression tests
// ---------------------------------------------------------------------------

describe('buildGameplayTuning — merged tuning per difficulty', () => {
  it.each(DIFFICULTY_IDS)('produces a valid GameplayTuning for %s difficulty', (difficultyId) => {
    const tuning = buildGameplayTuning(difficultyId);

    expect(tuning.difficultyId).toBe(difficultyId);
    expect(tuning.targetAltitude).toBeGreaterThan(0);
    expect(tuning.maxStability).toBeGreaterThan(0);
    expect(tuning.startingStability).toBeGreaterThan(0);
    expect(tuning.startingStability).toBeLessThanOrEqual(tuning.maxStability);
    expect(tuning.promptHoldMs).toBeGreaterThan(0);
    expect(tuning.promptDecayMs).toBeGreaterThan(0);
    expect(tuning.correctAltitudePerSecond).toBeGreaterThan(0);
    expect(tuning.correctStabilityPerSecond).toBeGreaterThan(0);
    expect(tuning.incorrectAltitudePenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.incorrectStabilityPenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.missingAltitudePenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.missingStabilityPenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.boostAltitudePerSecond).toBeGreaterThan(0);
    expect(tuning.hazardAltitudePenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.boostStabilityPerSecond).toBeGreaterThan(0);
    expect(tuning.hazardStabilityPenaltyPerSecond).toBeGreaterThan(0);
    expect(tuning.criticalStabilityThreshold).toBeGreaterThan(0);
    expect(tuning.criticalStabilityThreshold).toBeLessThan(tuning.maxStability);
    expect(tuning.completionBonus).toBeGreaterThan(0);
    expect(tuning.scoreMultiplier).toBeGreaterThan(0);
    expect(tuning.hazardCadenceMs).toBeGreaterThan(0);
    expect(tuning.boostCadenceMs).toBeGreaterThan(0);
    expect(tuning.promptCadenceMs).toBeGreaterThan(0);
    expect(tuning.noteWindowCentsTolerance).toBeGreaterThan(0);
  });

  it('preserves difficulty-specific tuning fields (promptCadenceMs, scoreMultiplier)', () => {
    const easy = buildGameplayTuning('easy');
    const normal = buildGameplayTuning('normal');
    const hard = buildGameplayTuning('hard');

    // promptCadenceMs: easy slowest, hard fastest
    expect(easy.promptCadenceMs).toBeGreaterThan(normal.promptCadenceMs);
    expect(normal.promptCadenceMs).toBeGreaterThan(hard.promptCadenceMs);

    // scoreMultiplier: easy lowest, hard highest
    expect(easy.scoreMultiplier).toBeLessThanOrEqual(normal.scoreMultiplier);
    expect(normal.scoreMultiplier).toBeLessThanOrEqual(hard.scoreMultiplier);
  });

  it('applies overrides on top of merged tuning', () => {
    const tuning = buildGameplayTuning('normal', { targetAltitude: 5000 });
    expect(tuning.targetAltitude).toBe(5000);
    expect(tuning.difficultyId).toBe('normal');
  });

  it('shares identical base values across all difficulties', () => {
    const easy = buildGameplayTuning('easy');
    const normal = buildGameplayTuning('normal');
    const hard = buildGameplayTuning('hard');

    // Base gameplay tuning values should be the same across difficulties
    expect(easy.targetAltitude).toBe(normal.targetAltitude);
    expect(normal.targetAltitude).toBe(hard.targetAltitude);
    expect(easy.startingStability).toBe(normal.startingStability);
    expect(normal.startingStability).toBe(hard.startingStability);
    expect(easy.completionBonus).toBe(normal.completionBonus);
    expect(normal.completionBonus).toBe(hard.completionBonus);
  });
});

describe('event catalog polarity consistency', () => {
  it.each(DIFFICULTY_IDS)(
    'all hazard events have negative altitude and stability for %s',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      for (const event of createHazardCatalog(tuning)) {
        expect(event.altitudePerSecond).toBeLessThan(0);
        expect(event.stabilityPerSecond).toBeLessThan(0);
        expect(event.kind).toBe('hazard');
      }
    },
  );

  it.each(DIFFICULTY_IDS)(
    'all boost events have positive altitude and stability for %s',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      for (const event of createBoostCatalog(tuning)) {
        expect(event.altitudePerSecond).toBeGreaterThan(0);
        expect(event.stabilityPerSecond).toBeGreaterThan(0);
        expect(event.kind).toBe('boost');
      }
    },
  );

  it.each(DIFFICULTY_IDS)(
    'all event IDs are unique across both catalogs for %s',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      const allEvents = [...createHazardCatalog(tuning), ...createBoostCatalog(tuning)];
      const ids = allEvents.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );
});

describe('firstAppearanceMs validation', () => {
  it.each(DIFFICULTY_IDS)(
    'all firstAppearanceMs values are non-negative and reasonable for %s',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      const allEvents = [...createHazardCatalog(tuning), ...createBoostCatalog(tuning)];

      for (const event of allEvents) {
        if (event.firstAppearanceMs !== undefined) {
          expect(event.firstAppearanceMs).toBeGreaterThanOrEqual(0);
          // No event should appear later than 5 minutes into a run
          expect(event.firstAppearanceMs).toBeLessThanOrEqual(300_000);
        }
      }
    },
  );

  it('events without firstAppearanceMs can trigger from the start', () => {
    const tuning = buildGameplayTuning('normal');
    const hazards = createHazardCatalog(tuning);
    const boosts = createBoostCatalog(tuning);

    // Asteroid Drift and Starlight Burst should have no firstAppearanceMs
    const asteroidDrift = hazards.find((e) => e.id === DEFAULT_HAZARD_ID)!;
    const starlightBurst = boosts.find((e) => e.id === DEFAULT_BOOST_ID)!;

    expect(asteroidDrift.firstAppearanceMs).toBeUndefined();
    expect(starlightBurst.firstAppearanceMs).toBeUndefined();
  });

  it('Solar Flare and Gravity Well have progressively later first appearances', () => {
    const tuning = buildGameplayTuning('normal');
    const hazards = createHazardCatalog(tuning);

    const solarFlare = hazards.find((e) => e.id === SOLAR_FLARE_HAZARD_ID)!;
    const gravityWell = hazards.find((e) => e.id === GRAVITY_WELL_HAZARD_ID)!;

    expect(solarFlare.firstAppearanceMs).toBeDefined();
    expect(gravityWell.firstAppearanceMs).toBeDefined();
    expect(gravityWell.firstAppearanceMs!).toBeGreaterThan(solarFlare.firstAppearanceMs!);
  });
});

describe('difficulty scaling relative ordering', () => {
  function getCatalogDurations(difficultyId: DifficultyId, kind: 'hazard' | 'boost') {
    const tuning = buildGameplayTuning(difficultyId);
    const catalog = kind === 'hazard' ? createHazardCatalog(tuning) : createBoostCatalog(tuning);
    return catalog.map((e) => e.durationMs);
  }

  it('easy hazards have shorter durations than hard hazards', () => {
    const easyDurations = getCatalogDurations('easy', 'hazard');
    const hardDurations = getCatalogDurations('hard', 'hazard');

    for (let i = 0; i < easyDurations.length; i++) {
      expect(easyDurations[i]).toBeLessThan(hardDurations[i]);
    }
  });

  it('easy boosts have longer durations than hard boosts', () => {
    const easyDurations = getCatalogDurations('easy', 'boost');
    const hardDurations = getCatalogDurations('hard', 'boost');

    for (let i = 0; i < easyDurations.length; i++) {
      expect(easyDurations[i]).toBeGreaterThan(hardDurations[i]);
    }
  });
});

describe('createInitialRocketState', () => {
  it('initializes altitude to 0 and stability from tuning', () => {
    const tuning = buildGameplayTuning('normal');
    const rocket = createInitialRocketState(tuning);

    expect(rocket.altitude).toBe(0);
    expect(rocket.velocity).toBe(0);
    expect(rocket.stability).toBe(tuning.startingStability);
    expect(rocket.thrust).toBe(0);
    expect(rocket.mode).toBe('steady');
  });
});

describe('createInitialGameplayMetrics', () => {
  it('initializes all counters to zero with provided lowestStability', () => {
    const metrics = createInitialGameplayMetrics(80);

    expect(metrics.correctMs).toBe(0);
    expect(metrics.incorrectMs).toBe(0);
    expect(metrics.missingMs).toBe(0);
    expect(metrics.longestCorrectStreakMs).toBe(0);
    expect(metrics.currentCorrectStreakMs).toBe(0);
    expect(metrics.hazardsTriggered).toBe(0);
    expect(metrics.boostsTriggered).toBe(0);
    expect(metrics.peakAltitude).toBe(0);
    expect(metrics.lowestStability).toBe(80);
  });
});
