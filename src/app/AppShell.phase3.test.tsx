import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_IDS,
  getDifficultyCalibration,
  type DifficultyId,
} from '@shared/config/difficulty';
import {
  buildCalibrationFromPreset,
  buildSolfegeWindows,
  CALIBRATION_PRESET_IDS,
  type CalibrationPresetId,
} from '@shared/config/solfege';
import {
  buildGameplayTuning,
  createBoostCatalog,
  createHazardCatalog,
  DEFAULT_BOOST_ID,
  DEFAULT_HAZARD_ID,
  GRAVITY_WELL_HAZARD_ID,
  NEBULA_SHIELD_BOOST_ID,
  SOLAR_FLARE_HAZARD_ID,
} from '@features/game/engine';
import {
  classifyWithConfidence,
  SILENCE_THRESHOLD_RMS,
} from '@features/audio/pitch';
import {
  createEmptyDifficultyProgressIndex,
  createEmptyProgressionSnapshot,
  detectNewMilestones,
  MILESTONE_DEFINITIONS,
  type ProgressionSnapshot,
  type RunResultSummary,
} from '@features/progression';
import {
  persistRunSummary,
  loadProgressionState,
  VIBEN_LOCAL_SAVE_KEY,
} from '@shared/persistence';

// ---------------------------------------------------------------------------
// Task 3.5 — Phase 3 integration tests
//
// These tests verify that Phase 3 features (milestones, calibration presets,
// expanded hazard/boost catalogs, difficulty scaling, classifyWithConfidence)
// integrate correctly when combined.
// ---------------------------------------------------------------------------

function createStats(overrides: Partial<{ rms: number; peak: number }> = {}) {
  return {
    capturedAt: 100,
    frameSize: 2048,
    sampleRate: 48_000,
    rms: overrides.rms ?? 0.03,
    peak: overrides.peak ?? 0.15,
  };
}

function makeRun(
  overrides: Partial<RunResultSummary> & { id: string; difficultyId: DifficultyId },
): RunResultSummary {
  return {
    recordedAt: new Date().toISOString(),
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

// ---------------------------------------------------------------------------
// 1. Milestone detection fires correctly on run completion
// ---------------------------------------------------------------------------

describe('milestone detection on run completion', () => {
  it('awards first-run milestone for a high-accuracy completed run', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({
          id: 'r1',
          difficultyId: 'normal',
          score: 2500,
          stars: 3,
          outcome: 'completed',
          performance: {
            accuracyPercent: 95,
            timeOnTargetMs: 55000,
            longestCorrectStreak: 15,
            promptsCleared: 19,
            promptsPresented: 20,
          },
        }),
      ],
    });

    const milestones = detectNewMilestones(snapshot);
    const ids = milestones.map((m) => m.id);

    expect(ids).toContain('first-run');
    expect(ids).toContain('score-over-1000');
    expect(ids).toContain('first-3-star-run');
    expect(ids).toContain('completed-normal');
  });

  it('persists milestones when a run is saved via persistRunSummary', () => {
    const result = persistRunSummary(
      makeRun({
        id: 'milestone-test-run',
        difficultyId: 'easy',
        score: 1500,
        stars: 3,
        outcome: 'completed',
      }),
    );

    // The save should now contain newly detected milestones
    expect(result.save.milestones.length).toBeGreaterThan(0);
    const milestoneIds = result.save.milestones.map((m) => m.id);
    expect(milestoneIds).toContain('first-run');
    expect(milestoneIds).toContain('score-over-1000');

    // Verify persistence via reload
    const loaded = loadProgressionState();
    expect(loaded.save.milestones.length).toBe(result.save.milestones.length);
  });

  it('does not duplicate milestones on subsequent runs', () => {
    // First run
    persistRunSummary(
      makeRun({ id: 'r1', difficultyId: 'easy', score: 1500 }),
    );

    const afterFirst = loadProgressionState();
    const firstMilestoneCount = afterFirst.save.milestones.length;

    // Second run on same difficulty
    persistRunSummary(
      makeRun({ id: 'r2', difficultyId: 'easy', score: 800 }),
    );

    const afterSecond = loadProgressionState();

    // Should have the same milestone IDs (some new ones may appear for 5-runs etc,
    // but duplicates must never occur)
    const ids = afterSecond.save.milestones.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('awards difficulty-specific milestones only for their difficulty', () => {
    const snapshot = makeSnapshot({
      runHistory: [
        makeRun({ id: 'r1', difficultyId: 'easy', outcome: 'completed' }),
      ],
    });
    const milestones = detectNewMilestones(snapshot);
    const ids = milestones.map((m) => m.id);

    expect(ids).toContain('completed-easy');
    expect(ids).not.toContain('completed-normal');
    expect(ids).not.toContain('completed-hard');
  });
});

// ---------------------------------------------------------------------------
// 2. Calibration presets produce valid solfege windows for each difficulty
// ---------------------------------------------------------------------------

describe('calibration preset × difficulty integration', () => {
  it.each(CALIBRATION_PRESET_IDS)(
    'preset %s produces valid windows for all difficulties',
    (presetId) => {
      for (const difficultyId of DIFFICULTY_IDS) {
        const presetConfig = buildCalibrationFromPreset(presetId);
        const diffConfig = getDifficultyCalibration(difficultyId);
        const merged = { ...presetConfig, centsTolerance: diffConfig.centsTolerance };
        const windows = buildSolfegeWindows(merged);

        expect(windows).toHaveLength(7);
        for (const w of windows) {
          expect(w.minFrequencyHz).toBeLessThan(w.centerFrequencyHz);
          expect(w.centerFrequencyHz).toBeLessThan(w.maxFrequencyHz);
        }
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Expanded hazard/boost catalogs — valid structure and unique IDs
// ---------------------------------------------------------------------------

describe('expanded event catalogs — structure and uniqueness', () => {
  it.each(DIFFICULTY_IDS)(
    '%s difficulty: hazard catalog has 3 entries with valid structure',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      const hazards = createHazardCatalog(tuning);

      expect(hazards).toHaveLength(3);
      for (const h of hazards) {
        expect(h.id).toBeTruthy();
        expect(h.label).toBeTruthy();
        expect(h.kind).toBe('hazard');
        expect(h.cadenceMs).toBeGreaterThan(0);
        expect(h.durationMs).toBeGreaterThan(0);
        expect(h.altitudePerSecond).toBeLessThan(0);
        expect(h.stabilityPerSecond).toBeLessThan(0);
        expect(typeof h.scoreDelta).toBe('number');
      }
    },
  );

  it.each(DIFFICULTY_IDS)(
    '%s difficulty: boost catalog has 2 entries with valid structure',
    (difficultyId) => {
      const tuning = buildGameplayTuning(difficultyId);
      const boosts = createBoostCatalog(tuning);

      expect(boosts).toHaveLength(2);
      for (const b of boosts) {
        expect(b.id).toBeTruthy();
        expect(b.label).toBeTruthy();
        expect(b.kind).toBe('boost');
        expect(b.cadenceMs).toBeGreaterThan(0);
        expect(b.durationMs).toBeGreaterThan(0);
        expect(b.altitudePerSecond).toBeGreaterThan(0);
        expect(b.stabilityPerSecond).toBeGreaterThan(0);
        expect(b.scoreDelta).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it('all 5 expected event IDs are present across catalogs', () => {
    const tuning = buildGameplayTuning('normal');
    const allEvents = [...createHazardCatalog(tuning), ...createBoostCatalog(tuning)];
    const ids = new Set(allEvents.map((e) => e.id));

    expect(ids.has(DEFAULT_HAZARD_ID)).toBe(true);
    expect(ids.has(SOLAR_FLARE_HAZARD_ID)).toBe(true);
    expect(ids.has(GRAVITY_WELL_HAZARD_ID)).toBe(true);
    expect(ids.has(DEFAULT_BOOST_ID)).toBe(true);
    expect(ids.has(NEBULA_SHIELD_BOOST_ID)).toBe(true);
    expect(ids.size).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 4. Difficulty scaling — relative ordering
// ---------------------------------------------------------------------------

describe('difficulty scaling — relative ordering', () => {
  it('easy hazards have shorter durations than hard hazards', () => {
    const easyHazards = createHazardCatalog(buildGameplayTuning('easy'));
    const hardHazards = createHazardCatalog(buildGameplayTuning('hard'));

    for (let i = 0; i < easyHazards.length; i++) {
      expect(easyHazards[i].durationMs).toBeLessThan(hardHazards[i].durationMs);
    }
  });

  it('easy boosts have longer durations than hard boosts', () => {
    const easyBoosts = createBoostCatalog(buildGameplayTuning('easy'));
    const hardBoosts = createBoostCatalog(buildGameplayTuning('hard'));

    for (let i = 0; i < easyBoosts.length; i++) {
      expect(easyBoosts[i].durationMs).toBeGreaterThan(hardBoosts[i].durationMs);
    }
  });

  it('easy hazard penalties are weaker than hard hazard penalties', () => {
    const easyHazards = createHazardCatalog(buildGameplayTuning('easy'));
    const hardHazards = createHazardCatalog(buildGameplayTuning('hard'));

    for (let i = 0; i < easyHazards.length; i++) {
      expect(Math.abs(easyHazards[i].altitudePerSecond)).toBeLessThan(
        Math.abs(hardHazards[i].altitudePerSecond),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 5. classifyWithConfidence integration with solfege configuration
// ---------------------------------------------------------------------------

describe('classifyWithConfidence — full integration', () => {
  it('correctly classifies and scores a centre note hit with difficulty calibration', () => {
    for (const difficultyId of DIFFICULTY_IDS) {
      const calibration = getDifficultyCalibration(difficultyId);
      const windows = buildSolfegeWindows(calibration);
      const doWindow = windows.find((w) => w.id === 'do')!;

      const result = classifyWithConfidence(
        doWindow.centerFrequencyHz,
        createStats(),
        calibration,
      );

      expect(result.classification).toBe('note');
      expect(result.noteId).toBe('do');
      expect(result.confidence).toBe(1);
    }
  });

  it('classifies silence with zero confidence regardless of calibration', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const result = classifyWithConfidence(
        null,
        createStats({ rms: SILENCE_THRESHOLD_RMS * 0.5 }),
        config,
      );

      expect(result.classification).toBe('silence');
      expect(result.confidence).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Privacy assertions — SP-01, SP-02, SP-06
// ---------------------------------------------------------------------------

describe('privacy — SP-01, SP-02, SP-06', () => {
  it('SP-06 persistRunSummary stores only structured gameplay data', () => {
    const result = persistRunSummary(
      makeRun({
        id: 'privacy-check',
        difficultyId: 'normal',
        score: 1000,
        outcome: 'completed',
      }),
    );

    const serialized = JSON.stringify(result.save);

    // Must not contain any raw audio-related keys
    expect(serialized).not.toContain('audioBuffer');
    expect(serialized).not.toContain('rawAudio');
    expect(serialized).not.toContain('voiceprint');
    expect(serialized).not.toContain('waveform');
    expect(serialized).not.toContain('pcmData');
    expect(serialized).not.toContain('timeDomainData');
    expect(serialized).not.toContain('frequencyData');
    expect(serialized).not.toContain('Float32Array');
    expect(serialized).not.toContain('recording');

    // Must contain expected structured fields
    expect(serialized).toContain('"score"');
    expect(serialized).toContain('"outcome"');
    expect(serialized).toContain('"difficultyId"');
    expect(serialized).toContain('"accuracyPercent"');
  });

  it('SP-06 local storage save schema only contains expected top-level keys', () => {
    persistRunSummary(
      makeRun({ id: 'schema-check', difficultyId: 'easy', score: 200 }),
    );

    const raw = JSON.parse(
      window.localStorage.getItem(VIBEN_LOCAL_SAVE_KEY) ?? '{}',
    ) as Record<string, unknown>;

    const expectedKeys = new Set([
      'version',
      'selectedDifficultyId',
      'lastUpdatedAt',
      'runHistory',
      'difficultyRecords',
      'milestones',
    ]);
    const actualKeys = new Set(Object.keys(raw));

    for (const key of actualKeys) {
      expect(expectedKeys.has(key)).toBe(true);
    }
  });

  it('SP-06 RunResultSummary fields are limited to gameplay metrics', () => {
    persistRunSummary(
      makeRun({ id: 'fields-check', difficultyId: 'hard', score: 3000 }),
    );

    const loaded = loadProgressionState();
    const run = loaded.save.runHistory[0];

    expect(run).toBeDefined();

    const runKeys = new Set(Object.keys(run!));
    const allowedKeys = new Set([
      'id',
      'recordedAt',
      'difficultyId',
      'outcome',
      'endReason',
      'score',
      'stars',
      'durationMs',
      'comparisonGroupId',
      'hazardsFaced',
      'boostsCaught',
      'performance',
    ]);

    for (const key of runKeys) {
      expect(allowedKeys.has(key)).toBe(true);
    }

    // Performance metrics sub-object
    const perfKeys = new Set(Object.keys(run!.performance));
    const allowedPerfKeys = new Set([
      'accuracyPercent',
      'timeOnTargetMs',
      'longestCorrectStreak',
      'promptsCleared',
      'promptsPresented',
    ]);

    for (const key of perfKeys) {
      expect(allowedPerfKeys.has(key)).toBe(true);
    }
  });

  it('SP-01 audio module public API does not export raw buffer accessors', () => {
    // The audio pitch module's public exports are classification functions
    // that return structured data (PitchDetectionSample), not raw audio.
    // classifyWithConfidence returns structured fields, never raw audio.
    const result = classifyWithConfidence(440, createStats());

    // Verify the returned object shape contains no raw audio data
    const keys = Object.keys(result);
    expect(keys).not.toContain('timeDomainData');
    expect(keys).not.toContain('audioBuffer');
    expect(keys).not.toContain('rawSamples');
    expect(keys).not.toContain('waveform');

    // Verify it contains only the expected classification fields
    expect(keys).toContain('classification');
    expect(keys).toContain('confidence');
    expect(keys).toContain('frequencyHz');
    expect(keys).toContain('rms');
    expect(keys).toContain('noteId');
  });

  it('SP-01 milestone records do not contain audio data', () => {
    const snapshot = makeSnapshot({
      runHistory: Array.from({ length: 5 }, (_, i) =>
        makeRun({ id: `r${i}`, difficultyId: 'easy', score: 1500 }),
      ),
    });
    const milestones = detectNewMilestones(snapshot);

    for (const m of milestones) {
      const serialized = JSON.stringify(m);
      expect(serialized).not.toContain('audio');
      expect(serialized).not.toContain('buffer');
      expect(serialized).not.toContain('waveform');

      // Milestone records should only have id, kind, difficultyId, achievedAt
      const keys = Object.keys(m);
      expect(keys.sort()).toEqual(['achievedAt', 'difficultyId', 'id', 'kind']);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Milestone catalog completeness
// ---------------------------------------------------------------------------

describe('milestone catalog completeness', () => {
  it('has exactly 12 milestone definitions', () => {
    expect(MILESTONE_DEFINITIONS).toHaveLength(12);
  });

  it('covers all 3 milestone kinds', () => {
    const kinds = new Set(MILESTONE_DEFINITIONS.map((d) => d.kind));
    expect(kinds.has('participation')).toBe(true);
    expect(kinds.has('performance')).toBe(true);
    expect(kinds.has('difficulty')).toBe(true);
  });

  it('all milestone definitions have non-empty labels and descriptions', () => {
    for (const def of MILESTONE_DEFINITIONS) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it('all milestone definitions have a callable check function', () => {
    const emptySnapshot = createEmptyProgressionSnapshot();
    for (const def of MILESTONE_DEFINITIONS) {
      expect(typeof def.check).toBe('function');
      // Should not throw when called with empty snapshot
      expect(() => def.check(emptySnapshot)).not.toThrow();
    }
  });
});
