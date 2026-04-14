import { DEFAULT_DIFFICULTY_ID, type DifficultyId } from '@shared/config/difficulty';
import type { RunOutcome, RunPerformanceMetrics, RunResultSummary } from '@features/progression';
import {
  buildGameplayTuning,
  createInitialGameplayMetrics,
  createInitialRocketState,
  createPromptSequence,
  createPromptState,
  resolveGameplayStep,
  type GameplayTuning,
  type PromptDefinition,
} from '../engine';
import type {
  ActiveGameState,
  GameRunSnapshot,
  GameRunSummary,
  GameState,
  GameStateAction,
  IdleGameState,
  SetupGameState,
} from './contracts';

export function createInitialGameState(difficultyId: DifficultyId = DEFAULT_DIFFICULTY_ID): IdleGameState {
  return {
    status: 'idle',
    selectedDifficultyId: difficultyId,
    lastSummary: null,
  };
}

export function createSetupState(difficultyId: DifficultyId): SetupGameState {
  const tuning = buildGameplayTuning(difficultyId);

  return {
    status: 'setup',
    selectedDifficultyId: difficultyId,
    setupPhase: 'awaiting-audio',
    tuning,
    promptPreview: createPromptState(createPromptSequence()),
    blocker: null,
  };
}

export function gameStateReducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'select-difficulty': {
      if (state.status === 'setup') {
        return createSetupState(action.difficultyId);
      }

      return {
        ...state,
        selectedDifficultyId: action.difficultyId,
      };
    }

    case 'begin-setup':
      return createSetupState(action.difficultyId ?? state.selectedDifficultyId);

    case 'mark-setup-ready':
      if (state.status !== 'setup') {
        return state;
      }

      if (state.setupPhase === 'ready') {
        return state;
      }

      return {
        ...state,
        setupPhase: 'ready',
      };

    case 'block-setup':
      if (
        state.status === 'blocked' &&
        state.blocker.code === action.blocker.code &&
        state.blocker.detail === action.blocker.detail &&
        state.blocker.recoverable === action.blocker.recoverable
      ) {
        return state;
      }

      return {
        status: 'blocked',
        selectedDifficultyId: state.selectedDifficultyId,
        blocker: action.blocker,
      };

    case 'start-run': {
      const difficultyId = state.selectedDifficultyId;
      const tuning = action.tuning ?? buildGameplayTuning(difficultyId);
      const promptSequence = action.promptSequence ?? createPromptSequence();

      return {
        status: 'active',
        selectedDifficultyId: difficultyId,
        run: {
          runId: action.runId,
          startedAtMs: action.startedAtMs,
          startedAtIso: action.startedAtIso,
          elapsedMs: 0,
          phase: 'active',
          endReason: null,
          tuning,
          rocket: createInitialRocketState(tuning),
          score: 0,
          promptState: createPromptState(promptSequence),
          activeEvent: null,
          eventHistory: [],
          metrics: createInitialGameplayMetrics(tuning.startingStability),
          lastAudioFrame: null,
        },
      };
    }

    case 'advance-run': {
      if (state.status !== 'active' || state.run.phase !== 'active') {
        return state;
      }

      const step = resolveGameplayStep({
        elapsedMs: action.elapsedMs,
        elapsedRunMs: state.run.elapsedMs + action.elapsedMs,
        nowMs: action.nowMs,
        promptState: state.run.promptState,
        rocket: state.run.rocket,
        score: state.run.score,
        metrics: state.run.metrics,
        audioFrame: action.audioFrame,
        tuning: state.run.tuning,
        activeEvent: state.run.activeEvent,
      });
      const nextRun: GameRunSnapshot = {
        ...state.run,
        elapsedMs: state.run.elapsedMs + action.elapsedMs,
        phase:
          step.outcome === 'completed'
            ? 'completed'
            : step.outcome === 'failed'
              ? 'failed'
              : 'active',
        endReason: step.endReason,
        rocket: step.rocket,
        score: state.run.score + step.scoreDelta,
        promptState: step.promptState,
        activeEvent: step.activeEvent,
        eventHistory: step.eventHistoryEntry
          ? [...state.run.eventHistory, step.eventHistoryEntry]
          : state.run.eventHistory,
        metrics: step.metrics,
        lastAudioFrame: action.audioFrame,
      };

      if (step.outcome === 'active') {
        return {
          ...state,
          run: nextRun,
        };
      }

      return {
        status: 'results',
        selectedDifficultyId: state.selectedDifficultyId,
        summary: buildGameRunSummary(nextRun, action.recordedAtIso),
      };
    }

    case 'finish-run': {
      if (state.status !== 'active') {
        return state;
      }

      return {
        status: 'results',
        selectedDifficultyId: state.selectedDifficultyId,
        summary: buildGameRunSummary(state.run, action.recordedAtIso, {
          outcome: action.outcome ?? 'abandoned',
          endReason: action.endReason ?? 'abandoned',
        }),
      };
    }

    case 'return-home': {
      const lastSummary = state.status === 'results' ? state.summary : state.status === 'idle' ? state.lastSummary : null;

      return {
        status: 'idle',
        selectedDifficultyId: state.selectedDifficultyId,
        lastSummary,
      };
    }
  }
}

export function buildGameRunSummary(
  run: GameRunSnapshot,
  recordedAtIso: string,
  overrides: {
    outcome?: RunOutcome;
    endReason?: GameRunSummary['endReason'];
  } = {},
): GameRunSummary {
  const performance = toRunPerformanceMetrics(run);
  const outcome = overrides.outcome ?? (run.phase === 'completed' ? 'completed' : 'failed');

  return {
    id: run.runId,
    recordedAt: recordedAtIso,
    difficultyId: run.tuning.difficultyId,
    outcome,
    score: run.score,
    stars: calculateStarRating(run, outcome),
    durationMs: run.elapsedMs,
    comparisonGroupId: null,
    performance,
    endReason: overrides.endReason ?? run.endReason ?? 'manual-return',
    finalAltitude: run.rocket.altitude,
    finalStability: run.rocket.stability,
    targetAltitude: run.tuning.targetAltitude,
    hazardsTriggered: run.metrics.hazardsTriggered,
    boostsTriggered: run.metrics.boostsTriggered,
  };
}

export function toProgressionRunSummary(summary: GameRunSummary): RunResultSummary {
  return {
    id: summary.id,
    recordedAt: summary.recordedAt,
    difficultyId: summary.difficultyId,
    outcome: summary.outcome,
    score: summary.score,
    stars: summary.stars,
    durationMs: summary.durationMs,
    comparisonGroupId: summary.comparisonGroupId,
    performance: summary.performance,
  };
}

function toRunPerformanceMetrics(run: GameRunSnapshot): RunPerformanceMetrics {
  const totalTrackedMs = run.metrics.correctMs + run.metrics.incorrectMs + run.metrics.missingMs;
  const accuracyPercent = totalTrackedMs > 0 ? (run.metrics.correctMs / totalTrackedMs) * 100 : null;

  return {
    accuracyPercent: accuracyPercent === null ? null : Number(accuracyPercent.toFixed(2)),
    timeOnTargetMs: run.metrics.correctMs,
    longestCorrectStreak: Math.round(run.metrics.longestCorrectStreakMs / 1000),
    promptsCleared: run.promptState.promptsCleared,
    promptsPresented: run.promptState.promptsPresented,
  };
}

function calculateStarRating(run: GameRunSnapshot, outcome: RunOutcome) {
  const altitudeRatio = run.tuning.targetAltitude > 0 ? run.rocket.altitude / run.tuning.targetAltitude : 0;

  if (outcome === 'completed') {
    return run.metrics.hazardsTriggered === 0 ? 3 : 2;
  }

  if (altitudeRatio >= 0.66) {
    return 2;
  }

  if (altitudeRatio >= 0.33 || run.metrics.correctMs > 0) {
    return 1;
  }

  return 0;
}
