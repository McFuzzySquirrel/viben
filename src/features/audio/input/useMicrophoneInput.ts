import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioInputError } from './errors';
import { createAudioInputSession, type AudioInputSession } from './session';
import { createUnsupportedAudioError, detectAudioInputSupport, queryMicrophonePermission } from './support';
import type { AudioBlockedReason, AudioInputPermissionState, AudioInputSnapshot } from './types';

function createInitialSnapshot(): AudioInputSnapshot {
  const support = detectAudioInputSupport();

  if (!support.isSupported) {
    return {
      support,
      permission: 'unsupported',
      readiness: 'blocked',
      blockedReason: support.isSecureContext ? 'unsupported-browser' : 'insecure-context',
      isCapturing: false,
      captureMetrics: null,
      lastError: createUnsupportedAudioError(support),
    };
  }

  return {
    support,
    permission: 'idle',
    readiness: 'idle',
    blockedReason: null,
    isCapturing: false,
    captureMetrics: null,
    lastError: null,
  };
}

export interface MicrophoneInputController {
  state: AudioInputSnapshot;
  session: AudioInputSession | null;
  requestMicrophoneAccess: () => Promise<boolean>;
  stopCapture: () => Promise<void>;
  reset: () => Promise<void>;
}

function isBlockedAudioReason(reason: AudioBlockedReason | 'unknown-error') {
  return [
    'permission-denied',
    'no-input-device',
    'device-unavailable',
    'unsupported-browser',
    'insecure-context',
  ].includes(reason);
}

function toPermissionState(
  blockedReason: AudioBlockedReason | 'unknown-error',
): AudioInputPermissionState {
  switch (blockedReason) {
    case 'permission-denied':
      return 'denied';
    case 'unsupported-browser':
    case 'insecure-context':
      return 'unsupported';
    case 'no-input-device':
    case 'device-unavailable':
      return 'granted';
    default:
      return 'error';
  }
}

export function useMicrophoneInput(): MicrophoneInputController {
  const [state, setState] = useState<AudioInputSnapshot>(() => createInitialSnapshot());
  const sessionRef = useRef<AudioInputSession | null>(null);

  const stopCapture = useCallback(async () => {
    const currentSession = sessionRef.current;
    sessionRef.current = null;

    if (currentSession) {
      await currentSession.close();
    }

    setState((currentState) => {
      if (!currentSession && !currentState.isCapturing) {
        return currentState;
      }

      return {
        ...currentState,
        readiness:
          currentState.permission === 'granted' && currentState.support.isSupported ? 'ready' : 'idle',
        blockedReason: null,
        isCapturing: false,
        captureMetrics: null,
        lastError: null,
      };
    });
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    const support = detectAudioInputSupport();

    if (!support.isSupported) {
      const error = createUnsupportedAudioError(support);
      setState({
        support,
        permission: 'unsupported',
        readiness: 'blocked',
        blockedReason: error.code === 'unknown-error' ? 'initialization-failed' : error.code,
        isCapturing: false,
        captureMetrics: null,
        lastError: error,
      });

      return false;
    }

    await stopCapture();
    setState((currentState) => ({
      ...currentState,
      support,
      permission: 'requesting',
      readiness: 'idle',
      blockedReason: null,
      isCapturing: false,
      captureMetrics: null,
      lastError: null,
    }));

    try {
      const session = await createAudioInputSession();
      await session.ensureRunning();
      sessionRef.current = session;

      setState((currentState) => ({
        ...currentState,
        support,
        permission: 'granted',
        readiness: 'capturing',
        blockedReason: null,
        isCapturing: true,
        captureMetrics: session.metrics,
        lastError: null,
      }));

      return true;
    } catch (error) {
      const mappedError = createAudioInputError(error);
      const permission = toPermissionState(mappedError.code);
      const readiness = isBlockedAudioReason(mappedError.code) ? 'blocked' : 'error';

      setState((currentState) => ({
        ...currentState,
        support,
        permission,
        readiness,
        blockedReason: mappedError.code === 'unknown-error' ? 'initialization-failed' : mappedError.code,
        isCapturing: false,
        captureMetrics: null,
        lastError: mappedError,
      }));

      return false;
    }
  }, [stopCapture]);

  const reset = useCallback(async () => {
    await stopCapture();
    setState(createInitialSnapshot());
  }, [stopCapture]);

  useEffect(() => {
    const support = detectAudioInputSupport();

    if (!support.isSupported) {
      return undefined;
    }

    let isMounted = true;

    void queryMicrophonePermission(support).then((permission) => {
      if (!isMounted) {
        return;
      }

      setState((currentState) => {
        if (currentState.permission === 'requesting' || currentState.isCapturing) {
          return currentState;
        }

        const blockedReason = permission === 'denied' ? 'permission-denied' : null;

        return {
          ...currentState,
          support,
          permission,
          readiness: permission === 'denied' ? 'blocked' : permission === 'granted' ? 'ready' : 'idle',
          blockedReason,
          lastError:
            permission === 'denied'
              ? {
                  code: 'permission-denied',
                  message: 'Microphone access is currently denied by the browser.',
                  recoverable: true,
                }
              : null,
        };
      });
    });

    return () => {
      isMounted = false;
      void stopCapture();
    };
  }, [stopCapture]);

  return {
    state,
    session: sessionRef.current,
    requestMicrophoneAccess,
    stopCapture,
    reset,
  };
}
