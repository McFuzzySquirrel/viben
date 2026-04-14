import type { SolfegeCalibrationConfig, SolfegeNoteId, SolfegeWindow } from '@shared/config/solfege';

export type PitchClassification = 'silence' | 'out-of-range' | 'note';
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
