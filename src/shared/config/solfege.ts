export const SOLFEGE_NOTE_IDS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'] as const;

export type SolfegeNoteId = (typeof SOLFEGE_NOTE_IDS)[number];

export interface SolfegeNoteDefinition {
  id: SolfegeNoteId;
  label: string;
  scientificPitch: string;
  semitoneOffsetFromA4: number;
}

export interface SolfegeCalibrationConfig {
  referenceFrequencyHz: number;
  centsTolerance: number;
  minimumSignalRms: number;
  minimumFrequencyHz: number;
  maximumFrequencyHz: number;
}

export interface SolfegeWindow extends SolfegeNoteDefinition {
  centerFrequencyHz: number;
  minFrequencyHz: number;
  maxFrequencyHz: number;
}

const SOLFEGE_NOTE_DEFINITIONS: ReadonlyArray<SolfegeNoteDefinition> = [
  { id: 'do', label: 'Do', scientificPitch: 'C4', semitoneOffsetFromA4: -9 },
  { id: 're', label: 'Re', scientificPitch: 'D4', semitoneOffsetFromA4: -7 },
  { id: 'mi', label: 'Mi', scientificPitch: 'E4', semitoneOffsetFromA4: -5 },
  { id: 'fa', label: 'Fa', scientificPitch: 'F4', semitoneOffsetFromA4: -4 },
  { id: 'sol', label: 'Sol', scientificPitch: 'G4', semitoneOffsetFromA4: -2 },
  { id: 'la', label: 'La', scientificPitch: 'A4', semitoneOffsetFromA4: 0 },
  { id: 'ti', label: 'Ti', scientificPitch: 'B4', semitoneOffsetFromA4: 2 },
] as const;

export const DEFAULT_SOLFEGE_CALIBRATION: SolfegeCalibrationConfig = {
  referenceFrequencyHz: 440,
  centsTolerance: 35,
  minimumSignalRms: 0.012,
  minimumFrequencyHz: 220,
  maximumFrequencyHz: 523.25,
} as const;

function toFrequency(referenceFrequencyHz: number, semitoneOffsetFromA4: number) {
  return referenceFrequencyHz * 2 ** (semitoneOffsetFromA4 / 12);
}

function toFrequencyOffset(frequencyHz: number, cents: number) {
  return frequencyHz * 2 ** (cents / 1200);
}

export function buildSolfegeWindows(
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
): ReadonlyArray<SolfegeWindow> {
  return SOLFEGE_NOTE_DEFINITIONS.map((note) => {
    const centerFrequencyHz = toFrequency(
      calibration.referenceFrequencyHz,
      note.semitoneOffsetFromA4,
    );

    return {
      ...note,
      centerFrequencyHz,
      minFrequencyHz: toFrequencyOffset(centerFrequencyHz, -calibration.centsTolerance),
      maxFrequencyHz: toFrequencyOffset(centerFrequencyHz, calibration.centsTolerance),
    };
  });
}

export function getSolfegeWindow(
  noteId: SolfegeNoteId,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
) {
  return buildSolfegeWindows(calibration).find((window) => window.id === noteId) ?? null;
}

export const DEFAULT_SOLFEGE_WINDOWS = buildSolfegeWindows();
