import { describe, expect, it } from 'vitest';
import { resolveGameplayStep } from './simulation';
import { createPromptSequence, createPromptState } from './prompt';
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
} from './tuning';

describe('gameplay simulation', () => {
  it('rewards correct matches by clearing prompts and climbing toward the target', () => {
    const tuning = buildGameplayTuning('easy', {
      promptHoldMs: 600,
    });
    const result = resolveGameplayStep({
      elapsedMs: 600,
      elapsedRunMs: 600,
      nowMs: 600,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.didClearPrompt).toBe(true);
    expect(result.promptState.promptsCleared).toBe(1);
    expect(result.rocket.altitude).toBeGreaterThan(0);
    expect(result.rocket.stability).toBeGreaterThan(tuning.startingStability);
    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.outcome).toBe('active');
  });

  it('starts deterministic hazards when the cadence boundary is crossed', () => {
    const tuning = buildGameplayTuning('normal');
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: tuning.hazardCadenceMs,
      nowMs: tuning.hazardCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'incorrect',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.activeEvent?.kind).toBe('hazard');
    expect(result.eventHistoryEntry?.kind).toBe('hazard');
    expect(result.metrics.hazardsTriggered).toBe(1);
    expect(result.rocket.mode).toBe('drifting');
  });

  it('fails the run when repeated missing input depletes stability', () => {
    const tuning = buildGameplayTuning('hard', {
      startingStability: 8,
      missingStabilityPenaltyPerSecond: 80,
      targetAltitude: 500,
    });
    const result = resolveGameplayStep({
      elapsedMs: 200,
      elapsedRunMs: 200,
      nowMs: 200,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'missing',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.outcome).toBe('failed');
    expect(result.endReason).toBe('stability-depleted');
    expect(result.rocket.mode).toBe('offline');
  });

  it('starts deterministic boosts when the boost cadence boundary is crossed', () => {
    const tuning = buildGameplayTuning('easy');
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: tuning.boostCadenceMs,
      nowMs: tuning.boostCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.activeEvent?.kind).toBe('boost');
    expect(result.eventHistoryEntry?.kind).toBe('boost');
    expect(result.metrics.boostsTriggered).toBe(1);
    expect(result.scoreDelta).toBeGreaterThan(0);
  });

  it('completes the run when the rocket reaches the moon target altitude', () => {
    const tuning = buildGameplayTuning('easy', {
      targetAltitude: 50,
      correctAltitudePerSecond: 100,
      promptHoldMs: 500,
    });
    const result = resolveGameplayStep({
      elapsedMs: 500,
      elapsedRunMs: 500,
      nowMs: 500,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: {
        sample: null,
        matchState: 'correct',
        targetNoteId: 'do',
      },
      tuning,
      activeEvent: null,
    });

    expect(result.outcome).toBe('completed');
    expect(result.endReason).toBe('moon-reached');
    expect(result.rocket.altitude).toBe(tuning.targetAltitude);
    expect(result.scoreDelta).toBeGreaterThanOrEqual(tuning.completionBonus);
  });
});

describe('updated base tuning values', () => {
  it('uses the updated base tuning defaults', () => {
    const tuning = buildGameplayTuning('normal');
    expect(tuning.startingStability).toBe(80);
    expect(tuning.missingAltitudePenaltyPerSecond).toBe(80);
    expect(tuning.missingStabilityPenaltyPerSecond).toBe(22);
    expect(tuning.criticalStabilityThreshold).toBe(20);
    expect(tuning.completionBonus).toBe(1000);
  });

  it('enters critical mode at the updated lower threshold', () => {
    const tuning = buildGameplayTuning('normal', {
      targetAltitude: 5000,
    });
    const rocket = { ...createInitialRocketState(tuning), stability: 21 };
    const result = resolveGameplayStep({
      elapsedMs: 16,
      elapsedRunMs: 16,
      nowMs: 16,
      promptState: createPromptState(createPromptSequence()),
      rocket,
      score: 0,
      metrics: createInitialGameplayMetrics(rocket.stability),
      audioFrame: { sample: null, matchState: 'correct', targetNoteId: 'do' },
      tuning,
      activeEvent: null,
    });
    // With stability near 21, correct input raises it slightly, stays above 20 → not critical
    expect(result.rocket.stability).toBeGreaterThan(tuning.criticalStabilityThreshold);
    expect(result.rocket.mode).toBe('boosting');
  });
});

describe('hazard and boost catalogs', () => {
  it('creates a hazard catalog with 3 entries and unique IDs', () => {
    const tuning = buildGameplayTuning('normal');
    const catalog = createHazardCatalog(tuning);
    expect(catalog).toHaveLength(3);
    const ids = catalog.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_HAZARD_ID);
    expect(ids).toContain(SOLAR_FLARE_HAZARD_ID);
    expect(ids).toContain(GRAVITY_WELL_HAZARD_ID);
  });

  it('creates a boost catalog with 2 entries and unique IDs', () => {
    const tuning = buildGameplayTuning('normal');
    const catalog = createBoostCatalog(tuning);
    expect(catalog).toHaveLength(2);
    const ids = catalog.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_BOOST_ID);
    expect(ids).toContain(NEBULA_SHIELD_BOOST_ID);
  });

  it('all event IDs are unique across hazard and boost catalogs combined', () => {
    const tuning = buildGameplayTuning('normal');
    const allEvents = [...createHazardCatalog(tuning), ...createBoostCatalog(tuning)];
    const ids = allEvents.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Solar Flare has high stability penalty and low altitude penalty', () => {
    const tuning = buildGameplayTuning('normal');
    const catalog = createHazardCatalog(tuning);
    const solarFlare = catalog.find((e) => e.id === SOLAR_FLARE_HAZARD_ID)!;
    const asteroidDrift = catalog.find((e) => e.id === DEFAULT_HAZARD_ID)!;
    expect(solarFlare.stabilityPerSecond).toBeLessThan(asteroidDrift.stabilityPerSecond);
    expect(Math.abs(solarFlare.altitudePerSecond)).toBeLessThan(
      Math.abs(asteroidDrift.altitudePerSecond),
    );
    expect(solarFlare.firstAppearanceMs).toBe(15_000);
  });

  it('Gravity Well has high altitude penalty and delayed first appearance', () => {
    const tuning = buildGameplayTuning('normal');
    const catalog = createHazardCatalog(tuning);
    const gravityWell = catalog.find((e) => e.id === GRAVITY_WELL_HAZARD_ID)!;
    const asteroidDrift = catalog.find((e) => e.id === DEFAULT_HAZARD_ID)!;
    expect(Math.abs(gravityWell.altitudePerSecond)).toBeGreaterThan(
      Math.abs(asteroidDrift.altitudePerSecond),
    );
    expect(gravityWell.firstAppearanceMs).toBe(30_000);
    expect(gravityWell.durationMs).toBeGreaterThan(asteroidDrift.durationMs);
  });

  it('Nebula Shield prioritizes stability recovery over altitude', () => {
    const tuning = buildGameplayTuning('normal');
    const catalog = createBoostCatalog(tuning);
    const nebulaShield = catalog.find((e) => e.id === NEBULA_SHIELD_BOOST_ID)!;
    expect(nebulaShield.stabilityPerSecond).toBe(15);
    expect(nebulaShield.altitudePerSecond).toBe(30);
    expect(nebulaShield.kind).toBe('boost');
  });

  it('all hazard events have negative altitude and stability deltas', () => {
    const tuning = buildGameplayTuning('normal');
    for (const event of createHazardCatalog(tuning)) {
      expect(event.altitudePerSecond).toBeLessThan(0);
      expect(event.stabilityPerSecond).toBeLessThan(0);
      expect(event.kind).toBe('hazard');
    }
  });

  it('all boost events have positive altitude and stability deltas', () => {
    const tuning = buildGameplayTuning('normal');
    for (const event of createBoostCatalog(tuning)) {
      expect(event.altitudePerSecond).toBeGreaterThan(0);
      expect(event.stabilityPerSecond).toBeGreaterThan(0);
      expect(event.kind).toBe('boost');
    }
  });
});

describe('difficulty-aware event scaling', () => {
  it('Easy difficulty reduces hazard durations and penalties', () => {
    const easyTuning = buildGameplayTuning('easy');
    const normalTuning = buildGameplayTuning('normal');
    const easyHazards = createHazardCatalog(easyTuning);
    const normalHazards = createHazardCatalog(normalTuning);

    for (let i = 0; i < easyHazards.length; i++) {
      expect(easyHazards[i].durationMs).toBeLessThan(normalHazards[i].durationMs);
      expect(Math.abs(easyHazards[i].altitudePerSecond)).toBeLessThan(
        Math.abs(normalHazards[i].altitudePerSecond),
      );
      expect(Math.abs(easyHazards[i].stabilityPerSecond)).toBeLessThan(
        Math.abs(normalHazards[i].stabilityPerSecond),
      );
    }
  });

  it('Easy difficulty increases boost durations', () => {
    const easyTuning = buildGameplayTuning('easy');
    const normalTuning = buildGameplayTuning('normal');
    const easyBoosts = createBoostCatalog(easyTuning);
    const normalBoosts = createBoostCatalog(normalTuning);

    for (let i = 0; i < easyBoosts.length; i++) {
      expect(easyBoosts[i].durationMs).toBeGreaterThan(normalBoosts[i].durationMs);
    }
  });

  it('Hard difficulty increases hazard durations and penalties', () => {
    const hardTuning = buildGameplayTuning('hard');
    const normalTuning = buildGameplayTuning('normal');
    const hardHazards = createHazardCatalog(hardTuning);
    const normalHazards = createHazardCatalog(normalTuning);

    for (let i = 0; i < hardHazards.length; i++) {
      expect(hardHazards[i].durationMs).toBeGreaterThan(normalHazards[i].durationMs);
      expect(Math.abs(hardHazards[i].altitudePerSecond)).toBeGreaterThan(
        Math.abs(normalHazards[i].altitudePerSecond),
      );
    }
  });

  it('Hard difficulty reduces boost durations', () => {
    const hardTuning = buildGameplayTuning('hard');
    const normalTuning = buildGameplayTuning('normal');
    const hardBoosts = createBoostCatalog(hardTuning);
    const normalBoosts = createBoostCatalog(normalTuning);

    for (let i = 0; i < hardBoosts.length; i++) {
      expect(hardBoosts[i].durationMs).toBeLessThan(normalBoosts[i].durationMs);
    }
  });

  it('Normal difficulty applies no scaling (baseline)', () => {
    const tuning = buildGameplayTuning('normal');
    const hazards = createHazardCatalog(tuning);
    const asteroidDrift = hazards.find((e) => e.id === DEFAULT_HAZARD_ID)!;
    expect(asteroidDrift.durationMs).toBe(2200);
  });
});

describe('firstAppearanceMs event gating', () => {
  it('does not trigger a hazard with firstAppearanceMs before that time has elapsed', () => {
    const tuning = buildGameplayTuning('normal');
    // Solar Flare has firstAppearanceMs: 15000 and cadenceMs ~11200 (8000 * 1.4)
    // At 11200ms it would cross its cadence boundary, but must not trigger since < 15000ms
    const solarFlareCadenceMs = Math.round(tuning.hazardCadenceMs * 1.4);
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: solarFlareCadenceMs,
      nowMs: solarFlareCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: { sample: null, matchState: 'correct', targetNoteId: 'do' },
      tuning,
      activeEvent: null,
      hazardCatalog: createHazardCatalog(tuning).filter(
        (e) => e.id === SOLAR_FLARE_HAZARD_ID,
      ),
      boostCatalog: [],
    });

    // Solar Flare's cadence is ~11200ms but firstAppearanceMs is 15000, so it must not trigger
    expect(result.activeEvent).toBeNull();
  });

  it('triggers a hazard with firstAppearanceMs once the elapsed run time exceeds it', () => {
    const tuning = buildGameplayTuning('normal');
    const solarFlareCadenceMs = Math.round(tuning.hazardCadenceMs * 1.4);
    // At 2 * cadence the event crosses the second cycle, and elapsed > 15000ms
    const elapsedRunMs = solarFlareCadenceMs * 2;
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs,
      nowMs: elapsedRunMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: { sample: null, matchState: 'correct', targetNoteId: 'do' },
      tuning,
      activeEvent: null,
      hazardCatalog: createHazardCatalog(tuning).filter(
        (e) => e.id === SOLAR_FLARE_HAZARD_ID,
      ),
      boostCatalog: [],
    });

    expect(result.activeEvent).not.toBeNull();
    expect(result.activeEvent?.id).toBe(SOLAR_FLARE_HAZARD_ID);
  });

  it('Asteroid Drift (no firstAppearanceMs) triggers normally at first cadence', () => {
    const tuning = buildGameplayTuning('normal');
    const result = resolveGameplayStep({
      elapsedMs: 100,
      elapsedRunMs: tuning.hazardCadenceMs,
      nowMs: tuning.hazardCadenceMs,
      promptState: createPromptState(createPromptSequence()),
      rocket: createInitialRocketState(tuning),
      score: 0,
      metrics: createInitialGameplayMetrics(tuning.startingStability),
      audioFrame: { sample: null, matchState: 'correct', targetNoteId: 'do' },
      tuning,
      activeEvent: null,
      hazardCatalog: createHazardCatalog(tuning).filter(
        (e) => e.id === DEFAULT_HAZARD_ID,
      ),
      boostCatalog: [],
    });

    expect(result.activeEvent).not.toBeNull();
    expect(result.activeEvent?.id).toBe(DEFAULT_HAZARD_ID);
  });
});
