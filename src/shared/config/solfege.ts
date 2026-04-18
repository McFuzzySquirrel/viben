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

// ---------------------------------------------------------------------------
// ST-03  Calibration Presets
// ---------------------------------------------------------------------------
// Presets act as an overlay on top of the difficulty-driven calibration.
// Difficulty (easy / normal / hard) controls the *primary* centsTolerance.
// A calibration preset can further widen or narrow that tolerance, and
// optionally shift referenceA4Hz for users with non-standard tuning.
// ---------------------------------------------------------------------------

export const CALIBRATION_PRESET_IDS = ['default', 'sensitive', 'strict'] as const;

export type CalibrationPresetId = (typeof CALIBRATION_PRESET_IDS)[number];

export interface CalibrationPreset {
  id: CalibrationPresetId;
  label: string;
  description: string;
  /** Cents tolerance override applied on top of difficulty. */
  centsTolerance: number;
  /** A4 reference frequency in Hz (standard = 440). */
  referenceA4Hz: number;
}

/**
 * Predefined calibration presets for ST-03.
 *
 * - **default** — Standard A4 = 440 Hz tuning, 35-cent tolerance (matches
 *   the DEFAULT_SOLFEGE_CALIBRATION baseline).
 * - **sensitive** — Wider 50-cent windows for beginners or noisy
 *   environments; more forgiving pitch matching.
 * - **strict** — Tighter 20-cent windows for advanced / practice-oriented
 *   players who want precision feedback.
 */
export const CALIBRATION_PRESETS: Readonly<Record<CalibrationPresetId, CalibrationPreset>> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Standard tuning with balanced note windows.',
    centsTolerance: 35,
    referenceA4Hz: 440,
  },
  sensitive: {
    id: 'sensitive',
    label: 'Sensitive',
    description: 'Wider note windows for beginners or noisy environments.',
    centsTolerance: 50,
    referenceA4Hz: 440,
  },
  strict: {
    id: 'strict',
    label: 'Strict',
    description: 'Tighter note windows for advanced players seeking precision.',
    centsTolerance: 20,
    referenceA4Hz: 440,
  },
} as const;

/**
 * Retrieve a calibration preset by ID.
 *
 * Returns the preset definition including `centsTolerance` and
 * `referenceA4Hz`.  Consumers can merge these values into a
 * `SolfegeCalibrationConfig` — typically via `getDifficultyCalibration`
 * which controls the primary tolerance, with the preset acting as an
 * optional advanced overlay.
 */
export function getCalibrationPreset(presetId: CalibrationPresetId): CalibrationPreset {
  return CALIBRATION_PRESETS[presetId];
}

/**
 * Build a `SolfegeCalibrationConfig` from a preset, optionally merging
 * additional overrides.  This is the simplest way to apply a preset when
 * difficulty-driven calibration is not involved.
 */
export function buildCalibrationFromPreset(
  presetId: CalibrationPresetId,
  overrides: Partial<SolfegeCalibrationConfig> = {},
): SolfegeCalibrationConfig {
  const preset = getCalibrationPreset(presetId);
  return {
    ...DEFAULT_SOLFEGE_CALIBRATION,
    referenceFrequencyHz: preset.referenceA4Hz,
    centsTolerance: preset.centsTolerance,
    ...overrides,
  };
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
