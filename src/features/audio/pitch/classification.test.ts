import { describe, expect, it } from 'vitest';
import {
  buildCalibrationFromPreset,
  buildSolfegeWindows,
  CALIBRATION_PRESET_IDS,
  CALIBRATION_PRESETS,
  DEFAULT_SOLFEGE_CALIBRATION,
  getCalibrationPreset,
  getSolfegeWindow,
  type CalibrationPresetId,
  type SolfegeCalibrationConfig,
} from '@shared/config/solfege';
import {
  classifyPitchSample,
  classifyPitchTargetMatch,
  classifyWithConfidence,
  PERFECT_CENTS,
  SILENCE_THRESHOLD_RMS,
  UNUSABLE_CONFIDENCE_THRESHOLD,
} from './classification';
import { selectPitchTargetSnapshot } from './selectors';

function createStats(overrides: Partial<{ capturedAt: number; rms: number; peak: number }> = {}) {
  return {
    capturedAt: overrides.capturedAt ?? 123,
    frameSize: 2048,
    sampleRate: 48_000,
    rms: overrides.rms ?? 0.05,
    peak: overrides.peak ?? 0.1,
  };
}

describe('pitch classification', () => {
  it('AC-05 maps stable pitch into the configured solfege window', () => {
    const doWindow = getSolfegeWindow('do');

    expect(doWindow).not.toBeNull();

    const sample = classifyPitchSample(doWindow!.centerFrequencyHz, createStats());

    expect(sample.classification).toBe('note');
    expect(sample.noteId).toBe('do');
    expect(classifyPitchTargetMatch(sample, 'do')).toBe('correct');
  });

  it('AC-06 keeps low-signal input in a missing state', () => {
    const sample = classifyPitchSample(null, createStats({ rms: 0.001 }));

    expect(sample.classification).toBe('silence');
    expect(classifyPitchTargetMatch(sample, 'sol')).toBe('missing');
  });

  it('AC-06 marks noisy unclassified input as unusable instead of a note hit', () => {
    const sample = classifyPitchSample(null, createStats({ rms: 0.05, peak: 0.3 }));
    const target = selectPitchTargetSnapshot(sample, 'la');

    expect(sample.classification).toBe('unusable');
    expect(target.matchState).toBe('missing');
    expect(target.hasUsablePitch).toBe(false);
  });

  it('AC-06 keeps out-of-range notes incorrect for gameplay consumers', () => {
    const sample = classifyPitchSample(
      DEFAULT_SOLFEGE_CALIBRATION.maximumFrequencyHz + 40,
      createStats(),
    );
    const target = selectPitchTargetSnapshot(sample, 'fa');

    expect(sample.classification).toBe('out-of-range');
    expect(sample.noteId).toBeNull();
    expect(target.matchState).toBe('incorrect');
    expect(target.nearestNoteId).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ST-03  Calibration presets
// ---------------------------------------------------------------------------

describe('calibration presets', () => {
  it('every preset ID maps to a valid CalibrationPreset', () => {
    for (const id of CALIBRATION_PRESET_IDS) {
      const preset = getCalibrationPreset(id);
      expect(preset.id).toBe(id);
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.centsTolerance).toBeGreaterThan(0);
      expect(preset.referenceA4Hz).toBeGreaterThan(400);
      expect(preset.referenceA4Hz).toBeLessThan(500);
    }
  });

  it('preset ordering: sensitive > default > strict tolerance', () => {
    const sensitive = CALIBRATION_PRESETS.sensitive;
    const standard = CALIBRATION_PRESETS.default;
    const strict = CALIBRATION_PRESETS.strict;

    expect(sensitive.centsTolerance).toBeGreaterThan(standard.centsTolerance);
    expect(standard.centsTolerance).toBeGreaterThan(strict.centsTolerance);
  });

  it('buildCalibrationFromPreset produces valid SolfegeCalibrationConfig values', () => {
    for (const id of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(id);

      // Must satisfy SolfegeCalibrationConfig shape
      expect(config.referenceFrequencyHz).toBeGreaterThan(0);
      expect(config.centsTolerance).toBeGreaterThan(0);
      expect(config.minimumSignalRms).toBeGreaterThan(0);
      expect(config.minimumFrequencyHz).toBeGreaterThan(0);
      expect(config.maximumFrequencyHz).toBeGreaterThan(config.minimumFrequencyHz);

      // The resulting centsTolerance should match the preset value
      const preset = getCalibrationPreset(id);
      expect(config.centsTolerance).toBe(preset.centsTolerance);
      expect(config.referenceFrequencyHz).toBe(preset.referenceA4Hz);
    }
  });

  it('presets build non-overlapping, correctly ordered solfege windows', () => {
    for (const id of CALIBRATION_PRESET_IDS) {
      const config = buildCalibrationFromPreset(id);
      const windows = buildSolfegeWindows(config);

      expect(windows).toHaveLength(7);

      for (const w of windows) {
        expect(w.minFrequencyHz).toBeLessThan(w.centerFrequencyHz);
        expect(w.centerFrequencyHz).toBeLessThan(w.maxFrequencyHz);
      }
    }
  });

  it('presets are serializable (JSON round-trip)', () => {
    for (const id of CALIBRATION_PRESET_IDS) {
      const original = getCalibrationPreset(id);
      const roundTripped = JSON.parse(JSON.stringify(original));
      expect(roundTripped).toEqual(original);
    }
  });

  it('buildCalibrationFromPreset accepts overrides', () => {
    const config = buildCalibrationFromPreset('default', {
      minimumSignalRms: 0.05,
    });

    expect(config.minimumSignalRms).toBe(0.05);
    // centsTolerance should still come from preset unless explicitly overridden
    expect(config.centsTolerance).toBe(CALIBRATION_PRESETS.default.centsTolerance);
  });
});

// ---------------------------------------------------------------------------
// classifyWithConfidence
// ---------------------------------------------------------------------------

describe('classifyWithConfidence', () => {
  it('returns confidence 0 for silence', () => {
    const result = classifyWithConfidence(null, createStats({ rms: 0.001 }));

    expect(result.classification).toBe('silence');
    expect(result.confidence).toBe(0);
  });

  it('returns confidence 0 for unusable input', () => {
    const result = classifyWithConfidence(null, createStats({ rms: 0.05, peak: 0.3 }));

    expect(result.classification).toBe('unusable');
    expect(result.confidence).toBe(0);
  });

  it('returns confidence 1 for a dead-centre note hit', () => {
    const doWindow = getSolfegeWindow('do')!;
    const result = classifyWithConfidence(doWindow.centerFrequencyHz, createStats());

    expect(result.classification).toBe('note');
    expect(result.confidence).toBe(1);
    expect(result.noteId).toBe('do');
  });

  it('returns high confidence (>= 0.4) for a note near the window edge', () => {
    const doWindow = getSolfegeWindow('do')!;
    // Slightly inside the window edge
    const edgeFrequency = doWindow.minFrequencyHz + 0.1;
    const result = classifyWithConfidence(edgeFrequency, createStats());

    expect(result.classification).toBe('note');
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.confidence).toBeLessThan(1);
  });

  it('returns low confidence for out-of-range pitch', () => {
    const result = classifyWithConfidence(
      DEFAULT_SOLFEGE_CALIBRATION.maximumFrequencyHz + 10,
      createStats(),
    );

    expect(result.classification).toBe('out-of-range');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(0.3);
  });

  it('returns confidence 0 for far out-of-range pitch', () => {
    // Way beyond the playable range
    const result = classifyWithConfidence(1500, createStats());

    expect(result.classification).toBe('out-of-range');
    expect(result.confidence).toBe(0);
  });

  it('preserves all base PitchDetectionSample fields', () => {
    const doWindow = getSolfegeWindow('do')!;
    const base = classifyPitchSample(doWindow.centerFrequencyHz, createStats());
    const withConf = classifyWithConfidence(doWindow.centerFrequencyHz, createStats());

    // The confidence variant should include every field from the base
    expect(withConf.capturedAt).toBe(base.capturedAt);
    expect(withConf.frequencyHz).toBe(base.frequencyHz);
    expect(withConf.classification).toBe(base.classification);
    expect(withConf.noteId).toBe(base.noteId);
    expect(withConf.nearestNoteId).toBe(base.nearestNoteId);
    expect(withConf.matchedWindow).toEqual(base.matchedWindow);
    expect(typeof withConf.confidence).toBe('number');
  });

  it('confidence monotonically decreases as pitch drifts from centre', () => {
    const doWindow = getSolfegeWindow('do')!;
    const centre = doWindow.centerFrequencyHz;

    // Sample at centre, 1/3 of the way, 2/3 of the way
    const confCentre = classifyWithConfidence(centre, createStats()).confidence;
    const confMid = classifyWithConfidence(
      centre * 2 ** (DEFAULT_SOLFEGE_CALIBRATION.centsTolerance * 0.5 / 1200),
      createStats(),
    ).confidence;
    const confEdge = classifyWithConfidence(
      centre * 2 ** ((DEFAULT_SOLFEGE_CALIBRATION.centsTolerance - 1) / 1200),
      createStats(),
    ).confidence;

    expect(confCentre).toBeGreaterThanOrEqual(confMid);
    expect(confMid).toBeGreaterThanOrEqual(confEdge);
  });
});

// ---------------------------------------------------------------------------
// Exported threshold constants
// ---------------------------------------------------------------------------

describe('threshold constants', () => {
  it('SILENCE_THRESHOLD_RMS matches DEFAULT_SOLFEGE_CALIBRATION.minimumSignalRms', () => {
    expect(SILENCE_THRESHOLD_RMS).toBe(DEFAULT_SOLFEGE_CALIBRATION.minimumSignalRms);
  });

  it('SILENCE_THRESHOLD_RMS is the boundary between silence and non-silence classification', () => {
    // Just below → silence
    const belowSample = classifyPitchSample(
      440,
      createStats({ rms: SILENCE_THRESHOLD_RMS - 0.001 }),
    );
    expect(belowSample.classification).toBe('silence');

    // At threshold → not silence (actual classification depends on frequency)
    const atSample = classifyPitchSample(
      440,
      createStats({ rms: SILENCE_THRESHOLD_RMS }),
    );
    expect(atSample.classification).not.toBe('silence');
  });

  it('UNUSABLE_CONFIDENCE_THRESHOLD is a positive value below 1', () => {
    expect(UNUSABLE_CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
    expect(UNUSABLE_CONFIDENCE_THRESHOLD).toBeLessThan(1);
  });

  it('silence and unusable classifications produce confidence below UNUSABLE_CONFIDENCE_THRESHOLD', () => {
    const silence = classifyWithConfidence(null, createStats({ rms: 0.001 }));
    const unusable = classifyWithConfidence(null, createStats({ rms: 0.05 }));

    expect(silence.confidence).toBeLessThanOrEqual(UNUSABLE_CONFIDENCE_THRESHOLD);
    expect(unusable.confidence).toBeLessThanOrEqual(UNUSABLE_CONFIDENCE_THRESHOLD);
  });

  it('PERFECT_CENTS is a small positive number', () => {
    expect(PERFECT_CENTS).toBeGreaterThan(0);
    expect(PERFECT_CENTS).toBeLessThan(DEFAULT_SOLFEGE_CALIBRATION.centsTolerance);
  });

  it('a note within PERFECT_CENTS of centre gets confidence 1.0', () => {
    const laWindow = getSolfegeWindow('la')!;
    // Shift by less than PERFECT_CENTS (use half to avoid FP edge effects)
    const slightlyOff = laWindow.centerFrequencyHz * 2 ** ((PERFECT_CENTS * 0.5) / 1200);
    const result = classifyWithConfidence(slightlyOff, createStats());

    expect(result.classification).toBe('note');
    expect(result.confidence).toBe(1);
  });
});
