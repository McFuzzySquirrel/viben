import {
  buildSolfegeWindows,
  DEFAULT_SOLFEGE_CALIBRATION,
  type SolfegeCalibrationConfig,
} from '@shared/config/solfege';

export const DIFFICULTY_IDS = ['easy', 'normal', 'hard'] as const;

export type DifficultyId = (typeof DIFFICULTY_IDS)[number];

export interface DifficultyTuningConfig {
  noteWindowCentsTolerance: number;
  promptCadenceMs: number;
  hazardCadenceMs: number;
  boostCadenceMs: number;
  scoreMultiplier: number;
}

export interface DifficultyDefinition {
  id: DifficultyId;
  label: string;
  summary: string;
  sortOrder: number;
  tuning: DifficultyTuningConfig;
}

export interface DifficultyOption {
  id: DifficultyId;
  label: string;
  summary: string;
}

export const DEFAULT_DIFFICULTY_ID: DifficultyId = 'easy';

const DIFFICULTY_DEFINITION_MAP: Readonly<Record<DifficultyId, DifficultyDefinition>> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    summary: 'Wider note windows and slower prompts for onboarding and mic confidence checks.',
    sortOrder: 0,
    tuning: {
      noteWindowCentsTolerance: 45,
      promptCadenceMs: 2800,
      hazardCadenceMs: 9500,
      boostCadenceMs: 12000,
      scoreMultiplier: 1,
    },
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    summary: 'Balanced prototype tuning for the default arcade climb.',
    sortOrder: 1,
    tuning: {
      noteWindowCentsTolerance: 35,
      promptCadenceMs: 2200,
      hazardCadenceMs: 8000,
      boostCadenceMs: 11000,
      scoreMultiplier: 1.15,
    },
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    summary: 'Tighter note windows and faster pressure for repeat players.',
    sortOrder: 2,
    tuning: {
      noteWindowCentsTolerance: 25,
      promptCadenceMs: 1700,
      hazardCadenceMs: 6500,
      boostCadenceMs: 10000,
      scoreMultiplier: 1.3,
    },
  },
} as const;

export const DIFFICULTY_OPTIONS: ReadonlyArray<DifficultyOption> = DIFFICULTY_IDS.map((id) => ({
  id,
  label: DIFFICULTY_DEFINITION_MAP[id].label,
  summary: DIFFICULTY_DEFINITION_MAP[id].summary,
}));

export const DIFFICULTY_DEFINITIONS: ReadonlyArray<DifficultyDefinition> = DIFFICULTY_IDS.map(
  (id) => DIFFICULTY_DEFINITION_MAP[id],
);

export function isDifficultyId(value: unknown): value is DifficultyId {
  return typeof value === 'string' && DIFFICULTY_IDS.includes(value as DifficultyId);
}

export function getDifficultyDefinition(difficultyId: DifficultyId): DifficultyDefinition {
  return DIFFICULTY_DEFINITION_MAP[difficultyId];
}

export function getDifficultyCalibration(
  difficultyId: DifficultyId,
  overrides: Partial<SolfegeCalibrationConfig> = {},
): SolfegeCalibrationConfig {
  return {
    ...DEFAULT_SOLFEGE_CALIBRATION,
    ...overrides,
    centsTolerance: getDifficultyDefinition(difficultyId).tuning.noteWindowCentsTolerance,
  };
}

export function buildDifficultySolfegeWindows(
  difficultyId: DifficultyId,
  overrides: Partial<SolfegeCalibrationConfig> = {},
) {
  return buildSolfegeWindows(getDifficultyCalibration(difficultyId, overrides));
}
