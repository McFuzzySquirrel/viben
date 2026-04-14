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

export interface PitchDetectionOptions extends SolfegeCalibrationConfig {
  yinThreshold: number;
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
