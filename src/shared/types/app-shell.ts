export {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_DEFINITIONS,
  DIFFICULTY_IDS,
  DIFFICULTY_OPTIONS,
  buildDifficultySolfegeWindows,
  getDifficultyCalibration,
  getDifficultyDefinition,
  isDifficultyId,
  type DifficultyDefinition,
  type DifficultyId,
  type DifficultyOption,
  type DifficultyTuningConfig,
} from '@shared/config/difficulty';

export type BrowserSupportTier = 'supported' | 'best-effort' | 'unsupported';
export type RunFlowStage = 'idle' | 'setup' | 'active' | 'results' | 'blocked';

export interface BrowserSupportState {
  tier: BrowserSupportTier;
  isSupported: boolean;
  missingFeatures: string[];
  supportedBrowsers: string[];
  requiresMicrophone: true;
  supportsLocalStorage: boolean;
  telemetryAllowed: false;
  privacyGuardrails: readonly string[];
}

export interface PlaceholderRunSummary {
  score: number | null;
  stars: number | null;
  accuracyPercent: number | null;
  stage: RunFlowStage;
}
