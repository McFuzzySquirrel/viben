import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AudioSetupStatus } from '@features/audio';
import { useGameplayAudioInput } from '@features/audio';
import { getDifficultyCalibration, type DifficultyId } from '@shared/config/difficulty';
import {
  createGameplayAudioFrame,
  createPromptSequence,
} from '../engine';
import type { GameplayAudioFrame } from '../engine';
import type { GameBlocker, GameResultsRouteState, GameRunSummary, GameState } from './contracts';
import { createSetupState, gameStateReducer } from './reducer';
import {
  selectCanStartRun,
  selectCurrentPrompt,
  selectLatestSummary,
  selectRunHudSnapshot,
  selectSummaryForProgression,
} from './selectors';

const MAX_FRAME_DELTA_MS = 200;

export interface GameRunController {
  state: GameState;
  audio: ReturnType<typeof useGameplayAudioInput>;
  currentPrompt: ReturnType<typeof selectCurrentPrompt>;
  hud: ReturnType<typeof selectRunHudSnapshot>;
  latestSummary: GameRunSummary | null;
  canStartRun: boolean;
  canRetrySetup: boolean;
  canAbandonRun: boolean;
  progressionSummary: ReturnType<typeof selectSummaryForProgression>;
  resultsRouteState: GameResultsRouteState | null;
  requestMicrophoneAccess: () => Promise<boolean>;
  startRun: () => Promise<boolean>;
  restartRun: () => Promise<boolean>;
  abandonRun: () => void;
  resetToSetup: () => void;
}

export function useGameRunController(difficultyId: DifficultyId): GameRunController {
  const [state, dispatch] = useReducer(gameStateReducer, difficultyId, createSetupState);
  const previousDifficultyRef = useRef(difficultyId);
  const currentPrompt = selectCurrentPrompt(state);
  const calibration = useMemo(() => getDifficultyCalibration(difficultyId), [difficultyId]);
  const audio = useGameplayAudioInput(currentPrompt?.noteId ?? null, calibration);
  const gameplayAudioFrameRef = useRef<GameplayAudioFrame | null>(null);

  useEffect(() => {
    gameplayAudioFrameRef.current = createGameplayAudioFrame(audio.latestSample, audio.target);
  }, [audio.latestSample, audio.target]);

  useEffect(() => {
    if (previousDifficultyRef.current === difficultyId) {
      return;
    }

    previousDifficultyRef.current = difficultyId;

    if (state.status !== 'active') {
      dispatch({
        type: 'begin-setup',
        difficultyId,
      });
    }
  }, [difficultyId, state.status]);

  useEffect(() => {
    if (state.status === 'active' || state.status === 'results') {
      return;
    }

    if (audio.setup.stage === 'capturing' || audio.setup.stage === 'ready') {
      dispatch({ type: 'mark-setup-ready' });

      return;
    }

    const blocker = createGameBlocker(audio.setup, audio.state.lastError?.message ?? null);

    if (blocker) {
      dispatch({
        type: 'block-setup',
        blocker,
      });
    } else if (state.status === 'blocked') {
      dispatch({
        type: 'begin-setup',
        difficultyId,
      });
    }
  }, [audio.setup, audio.state.lastError?.message, difficultyId, state.status]);

  useEffect(() => {
    if (state.status !== 'active') {
      return undefined;
    }

    let frameId = 0;
    let cancelled = false;
    let lastFrameAtMs: number | null = null;

    const tick = (frameAtMs: number) => {
      if (cancelled) {
        return;
      }

      const previousFrameAtMs = lastFrameAtMs ?? frameAtMs;
      const elapsedMs = Math.max(
        0,
        Math.min(Math.round(frameAtMs - previousFrameAtMs), MAX_FRAME_DELTA_MS),
      );

      lastFrameAtMs = frameAtMs;

      if (elapsedMs > 0) {
        dispatch({
          type: 'advance-run',
          nowMs: frameAtMs,
          elapsedMs,
          recordedAtIso: new Date().toISOString(),
          audioFrame: gameplayAudioFrameRef.current,
        });
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [state.status, state.status === 'active' ? state.run.runId : null]);

  const requestMicrophoneAccess = useCallback(async () => {
    const didGrant = await audio.requestMicrophoneAccess();

    return didGrant;
  }, [audio]);

  const startRun = useCallback(async () => {
    const hasCapture = audio.state.isCapturing || (await audio.requestMicrophoneAccess());

    if (!hasCapture) {
      return false;
    }

    const startedAtMs = performance.now();

    dispatch({
      type: 'start-run',
      runId: createRunId(),
      startedAtMs,
      startedAtIso: new Date().toISOString(),
      promptSequence: createPromptSequence(),
    });

    return true;
  }, [audio]);

  const resetToSetup = useCallback(() => {
    dispatch({
      type: 'begin-setup',
      difficultyId,
    });
  }, [difficultyId]);

  const restartRun = useCallback(async () => {
    resetToSetup();

    return startRun();
  }, [resetToSetup, startRun]);

  const abandonRun = useCallback(() => {
    dispatch({
      type: 'finish-run',
      recordedAtIso: new Date().toISOString(),
      outcome: 'abandoned',
      endReason: 'abandoned',
    });
  }, []);

  const hud = selectRunHudSnapshot(state);
  const latestSummary = selectLatestSummary(state);
  const progressionSummary = selectSummaryForProgression(state);
  const canStartRun = state.status === 'setup' && selectCanStartRun(state) && audio.state.isCapturing;
  const canRetrySetup =
    state.status === 'blocked' || audio.setup.canRetry || audio.setup.canRequestAccess;
  const canAbandonRun = state.status === 'active';

  return {
    state,
    audio,
    currentPrompt,
    hud,
    latestSummary,
    canStartRun,
    canRetrySetup,
    canAbandonRun,
    progressionSummary,
    resultsRouteState: state.status === 'results'
      ? {
          runSummary: state.summary,
        }
      : null,
    requestMicrophoneAccess,
    startRun,
    restartRun,
    abandonRun,
    resetToSetup,
  };
}

function createRunId() {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createGameBlocker(
  setup: AudioSetupStatus,
  errorMessage: string | null,
): GameBlocker | null {
  if (!(setup.stage === 'unsupported' || setup.stage === 'blocked' || setup.stage === 'error')) {
    return null;
  }

  if (setup.blockedReason === 'permission-denied') {
    return {
      code: 'microphone-denied',
      source: 'audio',
      recoverable: setup.canRetry || setup.canRequestAccess,
      detail: errorMessage ?? 'Microphone permission is required before a run can start.',
    };
  }

  if (setup.blockedReason === 'unsupported-browser' || setup.blockedReason === 'insecure-context') {
    return {
      code: 'unsupported-browser',
      source: 'audio',
      recoverable: false,
      detail: errorMessage ?? 'This browser cannot provide the microphone APIs required for gameplay.',
    };
  }

  return {
    code: 'audio-not-ready',
    source: 'audio',
    recoverable: setup.canRetry || setup.canRequestAccess,
    detail: errorMessage ?? 'The gameplay run cannot start until microphone capture is available.',
  };
}
