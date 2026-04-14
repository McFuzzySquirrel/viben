import type { RunOutcome, RunPerformanceMetrics, RunResultSummary } from '@features/progression';
import type { PitchTargetMatchState } from '@features/audio/pitch';
import type { DifficultyId } from '@shared/config/difficulty';
import type {
  GameRunEndReason,
  GameplayAudioFrame,
  GameplayEventInstance,
  GameplayEventRecord,
  GameplayMetrics,
  GameplayTuning,
  PromptDefinition,
  PromptState,
  RocketState,
  RocketFlightMode,
} from '../engine';

export const GAME_STATE_STATUSES = ['idle', 'setup', 'active', 'results', 'blocked'] as const;
export const RUN_SETUP_PHASES = ['selecting-difficulty', 'awaiting-audio', 'ready'] as const;
export const GAME_BLOCKER_CODES = [
  'microphone-denied',
  'unsupported-browser',
  'audio-not-ready',
  'unknown',
] as const;

export type GameStateStatus = (typeof GAME_STATE_STATUSES)[number];
export type RunSetupPhase = (typeof RUN_SETUP_PHASES)[number];
export type GameBlockerCode = (typeof GAME_BLOCKER_CODES)[number];

export interface GameBlocker {
  code: GameBlockerCode;
  source: 'audio' | 'system' | 'gameplay';
  recoverable: boolean;
  detail: string;
}

export interface GameRunSnapshot {
  runId: string;
  startedAtMs: number;
  startedAtIso: string;
  elapsedMs: number;
  phase: 'active' | 'failed' | 'completed';
  endReason: GameRunEndReason | null;
  tuning: GameplayTuning;
  rocket: RocketState;
  score: number;
  promptState: PromptState;
  activeEvent: GameplayEventInstance | null;
  eventHistory: ReadonlyArray<GameplayEventRecord>;
  metrics: GameplayMetrics;
  lastAudioFrame: GameplayAudioFrame | null;
}

export interface GameRunSummary
  extends Omit<RunResultSummary, 'performance' | 'outcome' | 'endReason' | 'hazardsFaced' | 'boostsCaught'> {
  outcome: RunOutcome;
  performance: RunPerformanceMetrics;
  endReason: GameRunEndReason | 'manual-return';
  finalAltitude: number;
  finalStability: number;
  targetAltitude: number;
  hazardsTriggered: number;
  boostsTriggered: number;
}

export interface GameRunProgressSnapshot {
  altitude: number;
  targetAltitude: number;
  altitudePercent: number;
  stability: number;
  maxStability: number;
  stabilityPercent: number;
  promptHoldMs: number;
  promptProgressPercent: number;
}

export interface GameHudSnapshot {
  status: GameStateStatus;
  prompt: PromptDefinition | null;
  score: number;
  elapsedMs: number;
  matchState: PitchTargetMatchState;
  rocketMode: RocketFlightMode | null;
  progress: GameRunProgressSnapshot | null;
  activeEvent: GameplayEventInstance | null;
  promptsCleared: number;
  promptsPresented: number;
  hazardsTriggered: number;
  boostsTriggered: number;
  altitude: number;
  altitudePercent: number;
  targetAltitude: number;
  stability: number;
  stabilityPercent: number;
  thrustPercent: number;
  promptHoldPercent: number;
}

export interface GameResultsRouteState {
  runSummary: GameRunSummary;
}

interface BaseGameState {
  selectedDifficultyId: DifficultyId;
}

export interface IdleGameState extends BaseGameState {
  status: 'idle';
  lastSummary: GameRunSummary | null;
}

export interface SetupGameState extends BaseGameState {
  status: 'setup';
  setupPhase: RunSetupPhase;
  tuning: GameplayTuning;
  promptPreview: PromptState;
  blocker: GameBlocker | null;
}

export interface ActiveGameState extends BaseGameState {
  status: 'active';
  run: GameRunSnapshot;
}

export interface ResultsGameState extends BaseGameState {
  status: 'results';
  summary: GameRunSummary;
}

export interface BlockedGameState extends BaseGameState {
  status: 'blocked';
  blocker: GameBlocker;
}

export type GameState =
  | IdleGameState
  | SetupGameState
  | ActiveGameState
  | ResultsGameState
  | BlockedGameState;

export type GameStateAction =
  | { type: 'select-difficulty'; difficultyId: DifficultyId }
  | { type: 'begin-setup'; difficultyId?: DifficultyId }
  | { type: 'mark-setup-ready' }
  | { type: 'block-setup'; blocker: GameBlocker }
  | {
      type: 'start-run';
      runId: string;
      startedAtMs: number;
      startedAtIso: string;
      tuning?: GameplayTuning;
      promptSequence?: ReadonlyArray<PromptDefinition>;
    }
  | {
      type: 'advance-run';
      nowMs: number;
      elapsedMs: number;
      recordedAtIso: string;
      audioFrame: GameplayAudioFrame | null;
    }
  | {
      type: 'finish-run';
      recordedAtIso: string;
      outcome?: Extract<RunOutcome, 'failed' | 'abandoned'>;
      endReason?: GameRunSummary['endReason'];
    }
  | { type: 'return-home' };
