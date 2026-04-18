import { YIN } from 'pitchfinder';
import {
  buildSolfegeWindows,
  DEFAULT_SOLFEGE_CALIBRATION,
  type SolfegeCalibrationConfig,
  type SolfegeNoteId,
  type SolfegeWindow,
} from '@shared/config/solfege';
import type { AudioCaptureStats } from '@features/audio/input';
import type {
  PitchDetectionOptions,
  PitchDetectionSample,
  PitchDetectionSampleWithConfidence,
  PitchTargetMatchState,
} from './types';

// ---------------------------------------------------------------------------
// Exported threshold constants (AC-06, NF-01)
// ---------------------------------------------------------------------------
// These constants define the decision boundaries for pitch classification.
// They are exported so that tests and consumers can verify that the values
// used at runtime match documented expectations.
// ---------------------------------------------------------------------------

/**
 * RMS power threshold below which audio is classified as **silence**.
 *
 * This value (0.025) was chosen to reject typical room ambient noise
 * and non-vocal sounds (≈ –32 dBFS) while still detecting intentional
 * singing.  It mirrors `DEFAULT_SOLFEGE_CALIBRATION.minimumSignalRms`.
 */
export const SILENCE_THRESHOLD_RMS = DEFAULT_SOLFEGE_CALIBRATION.minimumSignalRms;

/**
 * Confidence score at or below which a classification should be treated
 * as **unusable** by downstream consumers.
 *
 * The gameplay engine can use this constant to gate partial-credit logic:
 * samples with `confidence <= UNUSABLE_CONFIDENCE_THRESHOLD` carry too
 * little certainty to meaningfully influence scoring.
 */
export const UNUSABLE_CONFIDENCE_THRESHOLD = 0.15;

/**
 * Maximum absolute cents deviation from the centre of a note window
 * that still yields a confidence of 1.0.
 *
 * Pitch hits within ±PERFECT_CENTS of the window centre are considered
 * "dead-on" and receive the highest confidence score.
 */
export const PERFECT_CENTS = 5;

export const DEFAULT_PITCH_DETECTION_OPTIONS: PitchDetectionOptions = {
  ...DEFAULT_SOLFEGE_CALIBRATION,
  yinThreshold: 0.15,
} as const;

export function createPitchDetector(options: Partial<PitchDetectionOptions> = {}) {
  const config = { ...DEFAULT_PITCH_DETECTION_OPTIONS, ...options };

  return YIN({
    threshold: config.yinThreshold,
  });
}

export function classifyPitchSample(
  frequencyHz: number | null,
  stats: AudioCaptureStats,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
  customWindows?: ReadonlyArray<SolfegeWindow>,
): PitchDetectionSample {
  const windows = customWindows ?? buildSolfegeWindows(calibration);
  const nearestWindow = findNearestWindow(frequencyHz, windows);

  // AC-06 — RMS below the silence threshold means the mic is not picking up
  // anything intentional.  We check this *before* frequency-based rules so
  // that a stale detector output does not get mis-classified as a note.
  if (stats.rms < calibration.minimumSignalRms) {
    return {
      capturedAt: stats.capturedAt,
      frequencyHz: null,
      rms: stats.rms,
      peak: stats.peak,
      classification: 'silence',
      noteId: null,
      nearestNoteId: nearestWindow?.id ?? null,
      centsFromNearest: null,
      matchedWindow: null,
    };
  }

  // AC-06 — The pitch detector returned `null`: there is signal energy but
  // no extractable periodicity.  Typical causes: consonant noise, plosives,
  // breathing, or multi-voice interference.
  if (frequencyHz === null) {
    return {
      capturedAt: stats.capturedAt,
      frequencyHz: null,
      rms: stats.rms,
      peak: stats.peak,
      classification: 'unusable',
      noteId: null,
      nearestNoteId: null,
      centsFromNearest: null,
      matchedWindow: null,
    };
  }

  if (frequencyHz < calibration.minimumFrequencyHz || frequencyHz > calibration.maximumFrequencyHz) {
    return {
      capturedAt: stats.capturedAt,
      frequencyHz,
      rms: stats.rms,
      peak: stats.peak,
      classification: 'out-of-range',
      noteId: null,
      nearestNoteId: nearestWindow?.id ?? null,
      centsFromNearest: nearestWindow ? getCentsDifference(frequencyHz, nearestWindow.centerFrequencyHz) : null,
      matchedWindow: null,
    };
  }

  // Use nearest-window-by-center to avoid order-dependent ambiguity when
  // windows overlap (common with wide tolerance or voice-profile windows).
  const matchedWindow =
    nearestWindow &&
    frequencyHz >= nearestWindow.minFrequencyHz &&
    frequencyHz <= nearestWindow.maxFrequencyHz
      ? nearestWindow
      : null;

  if (!matchedWindow) {
    return {
      capturedAt: stats.capturedAt,
      frequencyHz,
      rms: stats.rms,
      peak: stats.peak,
      classification: 'out-of-range',
      noteId: null,
      nearestNoteId: nearestWindow?.id ?? null,
      centsFromNearest: nearestWindow ? getCentsDifference(frequencyHz, nearestWindow.centerFrequencyHz) : null,
      matchedWindow: null,
    };
  }

  return {
    capturedAt: stats.capturedAt,
    frequencyHz,
    rms: stats.rms,
    peak: stats.peak,
    classification: 'note',
    noteId: matchedWindow.id,
    nearestNoteId: matchedWindow.id,
    centsFromNearest: getCentsDifference(frequencyHz, matchedWindow.centerFrequencyHz),
    matchedWindow,
  };
}

// ---------------------------------------------------------------------------
// classifyWithConfidence  (ST-03 / gameplay weighting)
// ---------------------------------------------------------------------------
// Returns an extended sample that includes a 0–1 confidence score.
//
// Confidence semantics by classification:
//   silence      → 0    (no usable signal)
//   unusable     → 0    (energy present but no pitch)
//   out-of-range → low  (how close to the playable frequency range)
//   note         → high (how close to the centre of the matched window)
// ---------------------------------------------------------------------------

/**
 * Classify a pitch sample and attach a confidence score (0–1).
 *
 * The confidence score reflects how certain / centered the detection is:
 *
 * | Classification | Confidence logic                                     |
 * |----------------|------------------------------------------------------|
 * | `silence`      | Always 0                                             |
 * | `unusable`     | Always 0                                             |
 * | `out-of-range` | Decays from 0.3 based on distance from nearest note  |
 * | `note`         | 1.0 at centre, linearly decays toward window edge    |
 *
 * The gameplay engine can use `confidence` to implement partial-credit
 * scoring or visual feedback intensity.
 */
export function classifyWithConfidence(
  frequencyHz: number | null,
  stats: AudioCaptureStats,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
  customWindows?: ReadonlyArray<SolfegeWindow>,
): PitchDetectionSampleWithConfidence {
  const sample = classifyPitchSample(frequencyHz, stats, calibration, customWindows);
  return { ...sample, confidence: computeConfidence(sample, calibration) };
}

export function classifyPitchTargetMatch(
  sample: PitchDetectionSample | null,
  targetNoteId: SolfegeNoteId,
): PitchTargetMatchState {
  if (!sample || sample.classification === 'silence' || sample.classification === 'unusable') {
    return 'missing';
  }

  return sample.noteId === targetNoteId ? 'correct' : 'incorrect';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute a 0–1 confidence score for a classified pitch sample.
 */
function computeConfidence(
  sample: PitchDetectionSample,
  calibration: SolfegeCalibrationConfig,
): number {
  if (sample.classification === 'silence' || sample.classification === 'unusable') {
    return 0;
  }

  if (sample.classification === 'out-of-range') {
    // Provide a small confidence value that decays with distance from the
    // nearest recognised note.  Caps at 0.3 so it always stays below
    // a genuine note match.
    if (sample.centsFromNearest === null) {
      return 0;
    }
    const absCents = Math.abs(sample.centsFromNearest);
    // 100 cents = 1 semitone — beyond 1 semitone from nearest note
    // the confidence is effectively zero.
    return Math.max(0, 0.3 * (1 - absCents / 100));
  }

  // classification === 'note'
  if (sample.centsFromNearest === null) {
    return 1;
  }

  const absCents = Math.abs(sample.centsFromNearest);

  // Dead-on: within ±PERFECT_CENTS → confidence 1.0
  if (absCents <= PERFECT_CENTS) {
    return 1;
  }

  // Linear decay from 1.0 at PERFECT_CENTS to 0.4 at the window edge
  // (centsTolerance).  Even at the very edge of the window the player
  // still matched the note, so confidence never drops below 0.4.
  const range = calibration.centsTolerance - PERFECT_CENTS;
  if (range <= 0) {
    return 1;
  }

  const t = Math.min(1, (absCents - PERFECT_CENTS) / range);
  return 1 - 0.6 * t; // 1.0 → 0.4
}

function findNearestWindow(
  frequencyHz: number | null,
  windows: ReadonlyArray<SolfegeWindow>,
): SolfegeWindow | null {
  if (frequencyHz === null) {
    return null;
  }

  return windows.reduce<SolfegeWindow | null>((nearestWindow, currentWindow) => {
    if (!nearestWindow) {
      return currentWindow;
    }

    const currentDistance = Math.abs(frequencyHz - currentWindow.centerFrequencyHz);
    const nearestDistance = Math.abs(frequencyHz - nearestWindow.centerFrequencyHz);

    return currentDistance < nearestDistance ? currentWindow : nearestWindow;
  }, null);
}

function getCentsDifference(frequencyHz: number, targetFrequencyHz: number) {
  return 1200 * Math.log2(frequencyHz / targetFrequencyHz);
}
