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
  PitchTargetMatchState,
} from './types';

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
): PitchDetectionSample {
  const windows = buildSolfegeWindows(calibration);
  const nearestWindow = findNearestWindow(frequencyHz, windows);

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

  const matchedWindow =
    windows.find(
      (window) => frequencyHz >= window.minFrequencyHz && frequencyHz <= window.maxFrequencyHz,
    ) ?? null;

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

export function classifyPitchTargetMatch(
  sample: PitchDetectionSample | null,
  targetNoteId: SolfegeNoteId,
): PitchTargetMatchState {
  if (!sample || sample.classification === 'silence' || sample.classification === 'unusable') {
    return 'missing';
  }

  return sample.noteId === targetNoteId ? 'correct' : 'incorrect';
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
