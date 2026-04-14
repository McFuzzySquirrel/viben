export const DIFFICULTY_IDS = ['easy', 'normal', 'hard'] as const;

export type DifficultyId = (typeof DIFFICULTY_IDS)[number];
export type BrowserSupportTier = 'supported' | 'best-effort' | 'unsupported';
export type RunFlowStage = 'idle' | 'setup' | 'active' | 'results' | 'blocked';

export interface DifficultyOption {
  id: DifficultyId;
  label: string;
  summary: string;
}

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

export const DEFAULT_DIFFICULTY_ID: DifficultyId = 'easy';

export const DIFFICULTY_OPTIONS: ReadonlyArray<DifficultyOption> = [
  {
    id: 'easy',
    label: 'Easy',
    summary: 'Intro tuning for first-time players and mic setup validation.',
  },
  {
    id: 'normal',
    label: 'Normal',
    summary: 'Default prototype challenge once the core loop is wired in.',
  },
  {
    id: 'hard',
    label: 'Hard',
    summary: 'Reserved for tighter note windows and faster game pressure.',
  },
] as const;
