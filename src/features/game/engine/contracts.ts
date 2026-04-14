import type { PitchDetectionSample, PitchTargetMatchState } from '@features/audio/pitch';
import type { DifficultyId, DifficultyTuningConfig } from '@shared/config/difficulty';
import type { SolfegeNoteId } from '@shared/config/solfege';

export const GAMEPLAY_EVENT_KINDS = ['hazard', 'boost'] as const;
export const ROCKET_FLIGHT_MODES = ['steady', 'boosting', 'drifting', 'critical', 'offline'] as const;
export const GAME_RUN_END_REASONS = [
  'moon-reached',
  'stability-depleted',
  'setup-blocked',
  'abandoned',
] as const;

export type GameplayEventKind = (typeof GAMEPLAY_EVENT_KINDS)[number];
export type RocketFlightMode = (typeof ROCKET_FLIGHT_MODES)[number];
export type GameRunEndReason = (typeof GAME_RUN_END_REASONS)[number];

export interface GameplayTuning extends DifficultyTuningConfig {
  difficultyId: DifficultyId;
  targetAltitude: number;
  promptHoldMs: number;
  promptDecayMs: number;
  maxStability: number;
  startingStability: number;
  correctAltitudePerSecond: number;
  incorrectAltitudePenaltyPerSecond: number;
  missingAltitudePenaltyPerSecond: number;
  correctStabilityPerSecond: number;
  incorrectStabilityPenaltyPerSecond: number;
  missingStabilityPenaltyPerSecond: number;
  boostAltitudePerSecond: number;
  hazardAltitudePenaltyPerSecond: number;
  boostStabilityPerSecond: number;
  hazardStabilityPenaltyPerSecond: number;
  criticalStabilityThreshold: number;
  completionBonus: number;
}

export interface PromptDefinition {
  noteId: SolfegeNoteId;
  label: string;
  scientificPitch: string;
  sequenceIndex: number;
}

export interface PromptState {
  sequence: ReadonlyArray<PromptDefinition>;
  nextPromptIndex: number;
  currentPrompt: PromptDefinition | null;
  promptAgeMs: number;
  holdProgressMs: number;
  promptsPresented: number;
  promptsCleared: number;
}

export interface GameplayAudioFrame {
  sample: PitchDetectionSample | null;
  matchState: PitchTargetMatchState;
  targetNoteId: SolfegeNoteId | null;
}

export interface RocketState {
  altitude: number;
  velocity: number;
  stability: number;
  thrust: number;
  mode: RocketFlightMode;
}

export interface GameplayEventDefinition {
  id: string;
  kind: GameplayEventKind;
  label: string;
  cadenceMs: number;
  durationMs: number;
  altitudePerSecond: number;
  stabilityPerSecond: number;
  scoreDelta: number;
}

export interface GameplayEventInstance extends GameplayEventDefinition {
  startedAtMs: number;
  endsAtMs: number;
}

export interface GameplayEventRecord {
  id: string;
  kind: GameplayEventKind;
  label: string;
  startedAtMs: number;
  endsAtMs: number;
}

export interface GameplayMetrics {
  correctMs: number;
  incorrectMs: number;
  missingMs: number;
  longestCorrectStreakMs: number;
  currentCorrectStreakMs: number;
  hazardsTriggered: number;
  boostsTriggered: number;
  peakAltitude: number;
  lowestStability: number;
}

export interface GameplayStepInput {
  elapsedMs: number;
  elapsedRunMs: number;
  nowMs: number;
  promptState: PromptState;
  rocket: RocketState;
  score: number;
  metrics: GameplayMetrics;
  audioFrame: GameplayAudioFrame | null;
  tuning: GameplayTuning;
  activeEvent: GameplayEventInstance | null;
  hazardCatalog?: ReadonlyArray<GameplayEventDefinition>;
  boostCatalog?: ReadonlyArray<GameplayEventDefinition>;
}

export interface GameplayStepResult {
  rocket: RocketState;
  promptState: PromptState;
  scoreDelta: number;
  activeEvent: GameplayEventInstance | null;
  eventHistoryEntry: GameplayEventRecord | null;
  metrics: GameplayMetrics;
  didClearPrompt: boolean;
  outcome: 'active' | 'failed' | 'completed';
  endReason: GameRunEndReason | null;
}
