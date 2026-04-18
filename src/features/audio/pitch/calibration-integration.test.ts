import { describe, expect, it } from 'vitest';
import {
  buildCalibrationFromPreset,
  buildSolfegeWindows,
  CALIBRATION_PRESET_IDS,
  type CalibrationPresetId,
  type SolfegeCalibrationConfig,
} from '@shared/config/solfege';
import {
  buildDifficultySolfegeWindows,
  DIFFICULTY_IDS,
  getDifficultyCalibration,
  type DifficultyId,
} from '@shared/config/difficulty';
import {
  classifyWithConfidence,
  SILENCE_THRESHOLD_RMS,
  UNUSABLE_CONFIDENCE_THRESHOLD,
} from '@features/audio/pitch';

// ---------------------------------------------------------------------------
// Task 3.5 — Calibration integration tests
// ---------------------------------------------------------------------------

function createStats(overrides: Partial<{ capturedAt: number; rms: number; peak: number }> = {}) {
  return {
    capturedAt: overrides.capturedAt ?? 100,
    frameSize: 2048,
    sampleRate: 48_000,
    rms: overrides.rms ?? 0.03,
    peak: overrides.peak ?? 0.15,
  };
}

describe('calibration preset × difficulty — solfege window validity', () => {
  const combinations: Array<[CalibrationPresetId, DifficultyId]> = [];
  for (const preset of CALIBRATION_PRESET_IDS) {
    for (const difficulty of DIFFICULTY_IDS) {
      combinations.push([preset, difficulty]);
    }
  }

  it.each(combinations)(
    'preset=%s + difficulty=%s produces 7 valid solfege windows',
    (presetId, difficultyId) => {
      // Build calibration from preset and apply difficulty tolerance override
      const presetCalibration = buildCalibrationFromPreset(presetId);
      const difficultyCalibration = getDifficultyCalibration(difficultyId);
      const merged: SolfegeCalibrationConfig = {
        ...presetCalibration,
        centsTolerance: difficultyCalibration.centsTolerance,
      };
      const windows = buildSolfegeWindows(merged);

      expect(windows).toHaveLength(7);

      for (const w of windows) {
        expect(w.minFrequencyHz).toBeLessThan(w.centerFrequencyHz);
        expect(w.centerFrequencyHz).toBeLessThan(w.maxFrequencyHz);
        expect(w.minFrequencyHz).toBeGreaterThan(0);
        expect(w.centerFrequencyHz).toBeGreaterThan(0);
        expect(w.maxFrequencyHz).toBeGreaterThan(0);
      }
    },
  );

  it.each(combinations)(
    'preset=%s + difficulty=%s windows are in ascending frequency order',
    (presetId, difficultyId) => {
      const presetCalibration = buildCalibrationFromPreset(presetId);
      const difficultyCalibration = getDifficultyCalibration(difficultyId);
      const merged: SolfegeCalibrationConfig = {
        ...presetCalibration,
        centsTolerance: difficultyCalibration.centsTolerance,
      };
      const windows = buildSolfegeWindows(merged);

      for (let i = 1; i < windows.length; i++) {
        expect(windows[i].centerFrequencyHz).toBeGreaterThan(
          windows[i - 1].centerFrequencyHz,
        );
      }
    },
  );
});

describe('difficulty-driven solfege windows are ordered and valid', () => {
  it.each(DIFFICULTY_IDS)(
    '%s difficulty produces ordered, valid windows',
    (difficultyId) => {
      const windows = buildDifficultySolfegeWindows(difficultyId);

      // Windows must be in ascending frequency order
      for (let i = 1; i < windows.length; i++) {
        expect(windows[i].centerFrequencyHz).toBeGreaterThan(
          windows[i - 1].centerFrequencyHz,
        );
      }

      // Each window must be valid (min < center < max)
      for (const w of windows) {
        expect(w.minFrequencyHz).toBeLessThan(w.centerFrequencyHz);
        expect(w.centerFrequencyHz).toBeLessThan(w.maxFrequencyHz);
      }
    },
  );

  it('hard difficulty produces strictly non-overlapping windows', () => {
    const windows = buildDifficultySolfegeWindows('hard');

    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].minFrequencyHz).toBeGreaterThan(
        windows[i - 1].maxFrequencyHz,
      );
    }
  });
});

describe('preset-based windows do not significantly overlap', () => {
  it.each(CALIBRATION_PRESET_IDS)(
    '%s preset produces windows that do not meaningfully overlap',
    (presetId) => {
      const config = buildCalibrationFromPreset(presetId);
      const windows = buildSolfegeWindows(config);

      for (let i = 1; i < windows.length; i++) {
        const gap = windows[i].minFrequencyHz - windows[i - 1].maxFrequencyHz;
        // Wide tolerances (e.g. "sensitive" at 75 cents) can cause semitone-adjacent
        // notes (Mi–Fa, Ti–Do) to overlap. Allow overlap up to ~15 Hz which covers
        // the widest preset without permitting gross errors.
        expect(gap).toBeGreaterThanOrEqual(-15);
      }
    },
  );
});

describe('classifyWithConfidence — confidence score range', () => {
  it('confidence is 0 for silence across all calibrations', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const result = classifyWithConfidence(null, createStats({ rms: 0.001 }), config);

      expect(result.classification).toBe('silence');
      expect(result.confidence).toBe(0);
    }
  });

  it('confidence is 0 for unusable input across all calibrations', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const result = classifyWithConfidence(null, createStats({ rms: 0.05 }), config);

      expect(result.classification).toBe('unusable');
      expect(result.confidence).toBe(0);
    }
  });

  it('confidence is in [0, 1] for note classifications', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const windows = buildSolfegeWindows(config);

      for (const window of windows) {
        const result = classifyWithConfidence(window.centerFrequencyHz, createStats(), config);

        expect(result.classification).toBe('note');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('confidence is in [0, 0.3] for out-of-range classifications', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      // Slightly above the max frequency
      const result = classifyWithConfidence(
        config.maximumFrequencyHz + 20,
        createStats(),
        config,
      );

      expect(result.classification).toBe('out-of-range');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(0.3);
    }
  });

  it('centre-hit notes always produce confidence = 1 across all presets', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const windows = buildSolfegeWindows(config);

      for (const window of windows) {
        const result = classifyWithConfidence(window.centerFrequencyHz, createStats(), config);
        expect(result.confidence).toBe(1);
      }
    }
  });

  it('confidence is strictly in [0, 1] for edge-of-window hits', () => {
    for (const presetId of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(presetId);
      const windows = buildSolfegeWindows(config);

      for (const window of windows) {
        // Just inside the lower window edge
        const edgeFreq = window.minFrequencyHz + 0.01;
        const result = classifyWithConfidence(edgeFreq, createStats(), config);

        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('classifyWithConfidence integrates with difficulty calibrations', () => {
  it.each(DIFFICULTY_IDS)(
    'correctly classifies centre-of-window for %s difficulty',
    (difficultyId) => {
      const calibration = getDifficultyCalibration(difficultyId);
      const windows = buildSolfegeWindows(calibration);

      for (const window of windows) {
        const result = classifyWithConfidence(
          window.centerFrequencyHz,
          createStats(),
          calibration,
        );

        expect(result.classification).toBe('note');
        expect(result.noteId).toBe(window.id);
        expect(result.confidence).toBe(1);
      }
    },
  );
});
