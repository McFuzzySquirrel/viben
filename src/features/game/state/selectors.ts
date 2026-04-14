import type { RunResultSummary } from '@features/progression';
import type {
  GameHudSnapshot,
  GameRunProgressSnapshot,
  GameRunSnapshot,
  GameRunSummary,
  GameState,
} from './contracts';
import { toProgressionRunSummary } from './reducer';

export function selectCurrentPrompt(state: GameState) {
  if (state.status === 'active') {
    return state.run.promptState.currentPrompt;
  }

  if (state.status === 'setup') {
    return state.promptPreview.currentPrompt;
  }

  return null;
}

export function selectRocketState(state: GameState) {
  return state.status === 'active' ? state.run.rocket : null;
}

export function selectActiveRun(state: GameState): GameRunSnapshot | null {
  return state.status === 'active' ? state.run : null;
}

export function selectRunProgress(state: GameState): GameRunProgressSnapshot | null {
  const run = selectActiveRun(state);

  if (!run) {
    return null;
  }

  return {
    altitude: run.rocket.altitude,
    targetAltitude: run.tuning.targetAltitude,
    altitudePercent:
      run.tuning.targetAltitude > 0 ? (run.rocket.altitude / run.tuning.targetAltitude) * 100 : 0,
    stability: run.rocket.stability,
    maxStability: run.tuning.maxStability,
    stabilityPercent:
      run.tuning.maxStability > 0 ? (run.rocket.stability / run.tuning.maxStability) * 100 : 0,
    promptHoldMs: run.tuning.promptHoldMs,
    promptProgressPercent:
      run.tuning.promptHoldMs > 0 ? (run.promptState.holdProgressMs / run.tuning.promptHoldMs) * 100 : 0,
  };
}

export function selectRunHudSnapshot(state: GameState): GameHudSnapshot | null {
  const run = selectActiveRun(state);

  if (!run) {
    return null;
  }

  const progress = selectRunProgress(state);

  if (!progress) {
    return null;
  }

  return {
    status: state.status,
    prompt: run.promptState.currentPrompt,
    score: run.score,
    elapsedMs: run.elapsedMs,
    matchState: run.lastAudioFrame?.matchState ?? 'missing',
    altitude: run.rocket.altitude,
    altitudePercent: progress.altitudePercent,
    targetAltitude: run.tuning.targetAltitude,
    stability: run.rocket.stability,
    stabilityPercent: progress.stabilityPercent,
    thrustPercent: Math.max(0, Math.min(100, ((run.rocket.thrust + 1) / 2) * 100)),
    promptHoldPercent: progress.promptProgressPercent,
    rocketMode: run.rocket.mode,
    progress,
    promptsPresented: run.promptState.promptsPresented,
    promptsCleared: run.promptState.promptsCleared,
    activeEvent: run.activeEvent,
    hazardsTriggered: run.metrics.hazardsTriggered,
    boostsTriggered: run.metrics.boostsTriggered,
  };
}

export function selectCanStartRun(state: GameState) {
  return state.status === 'setup' && state.setupPhase === 'ready';
}

export function selectLatestSummary(state: GameState): GameRunSummary | null {
  if (state.status === 'results') {
    return state.summary;
  }

  if (state.status === 'idle') {
    return state.lastSummary;
  }

  return null;
}

export function selectSummaryForProgression(state: GameState): RunResultSummary | null {
  const summary = selectLatestSummary(state);

  return summary ? toProgressionRunSummary(summary) : null;
}
