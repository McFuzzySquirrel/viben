import type { SolfegeCalibrationConfig, SolfegeNoteId, SolfegeWindow } from '@shared/config/solfege';

export type PitchClassification = 'silence' | 'unusable' | 'out-of-range' | 'note';
export type PitchTargetMatchState = 'missing' | 'correct' | 'incorrect';

export interface PitchDetectionSample {
  capturedAt: number;
  frequencyHz: number | null;
  rms: number;
  peak: number;
  classification: PitchClassification;
  noteId: SolfegeNoteId | null;
  nearestNoteId: SolfegeNoteId | null;
  centsFromNearest: number | null;
  matchedWindow: SolfegeWindow | null;
}

/**
 * Extended pitch sample that includes a confidence score.
 *
 * The gameplay engine can use `confidence` (0–1) to weight pitch matches —
 * e.g. a confident note hit may award full points, while a low-confidence
 * match near a window edge may award partial credit.
 */
export interface PitchDetectionSampleWithConfidence extends PitchDetectionSample {
  /** 0–1 confidence score for the classification result. */
  confidence: number;
}

export interface PitchDetectionOptions extends SolfegeCalibrationConfig {
  yinThreshold: number;
}

/** Configuration for the pitch monitor analysis loop. */
export interface PitchMonitorConfig {
  /**
   * Target interval in milliseconds between successive pitch analysis ticks.
   *
   * Lower values increase CPU usage but decrease perceived latency.
   * The default of 80 ms keeps the full capture → classify → report path
   * well within the NF-01 150 ms budget while being gentle on CPU.
   *
   * Recommended range: 60–100 ms.
   */
  analysisIntervalMs: number;
}

export interface PitchMonitorState {
  calibration: SolfegeCalibrationConfig;
  isMonitoring: boolean;
  latestSample: PitchDetectionSample | null;
}

export interface PitchTargetSnapshot {
  targetNoteId: SolfegeNoteId | null;
  matchState: PitchTargetMatchState;
  classification: PitchClassification | null;
  detectedNoteId: SolfegeNoteId | null;
  nearestNoteId: SolfegeNoteId | null;
  centsOffTarget: number | null;
  hasUsablePitch: boolean;
}
