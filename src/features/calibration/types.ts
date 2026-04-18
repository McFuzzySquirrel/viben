import type { SolfegeNoteId } from '@shared/config/solfege';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';

// ---------------------------------------------------------------------------
// Voice Profile — Per-note calibration data captured during voice calibration
// ---------------------------------------------------------------------------

/** Aggregated calibration data for a single solfege note after capture. */
export interface NoteCalibrationData {
  noteId: SolfegeNoteId;
  /** Median of captured frequency samples (Hz). */
  medianFrequencyHz: number;
  /** Lowest captured frequency sample (Hz). */
  minFrequencyHz: number;
  /** Highest captured frequency sample (Hz). */
  maxFrequencyHz: number;
  /** Number of valid frequency samples collected. */
  sampleCount: number;
  /** ISO-8601 timestamp of when the note was captured. */
  capturedAt: string;
}

/** A complete voice profile containing calibration data for all 7 solfege notes. */
export interface VoiceProfile {
  version: 1;
  notes: Record<SolfegeNoteId, NoteCalibrationData>;
  /** ISO-8601 timestamp of when the profile was first created. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Calibration Capture Flow State
// ---------------------------------------------------------------------------

/** Status of a single note during the calibration capture flow. */
export type CalibrationNoteStatus = 'pending' | 'capturing' | 'captured' | 'skipped';

/** Transient state for the calibration capture flow UI. */
export interface CalibrationState {
  /** Index into SOLFEGE_NOTE_IDS for the note currently being calibrated. */
  currentNoteIndex: number;
  /** Per-note capture status. */
  noteStatuses: Record<SolfegeNoteId, CalibrationNoteStatus>;
  /** Captured calibration data; populated as each note completes. */
  capturedData: Partial<Record<SolfegeNoteId, NoteCalibrationData>>;
  /** True when all notes have been captured or skipped. */
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an initial `CalibrationState` with all notes pending and no captures. */
export function createInitialCalibrationState(): CalibrationState {
  const noteStatuses = Object.fromEntries(
    SOLFEGE_NOTE_IDS.map((id) => [id, 'pending' as const]),
  ) as Record<SolfegeNoteId, CalibrationNoteStatus>;

  return {
    currentNoteIndex: 0,
    noteStatuses,
    capturedData: {},
    isComplete: false,
  };
}
