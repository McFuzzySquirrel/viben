import type { RunResultSummary } from '@features/progression';
import type { GameRunSummary, GameState } from './contracts';
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

export function selectRunProgress(state: GameState) {
  if (state.status !== 'active') {
    return null;
  }

  return {
    altitudePercent:
      state.run.tuning.targetAltitude > 0
        ? (state.run.rocket.altitude / state.run.tuning.targetAltitude) * 100
        : 0,
    stabilityPercent:
      state.run.tuning.maxStability > 0
        ? (state.run.rocket.stability / state.run.tuning.maxStability) * 100
        : 0,
    promptProgressPercent:
      state.run.tuning.promptHoldMs > 0
        ? (state.run.promptState.holdProgressMs / state.run.tuning.promptHoldMs) * 100
        : 0,
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
