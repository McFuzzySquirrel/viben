import type { AudioBlockedReason, AudioInputError } from './types';

export function createAudioInputError(error: unknown): AudioInputError {
  if (error instanceof DOMException) {
    return mapDomExceptionToAudioError(error);
  }

  return {
    code: 'unknown-error',
    message: error instanceof Error ? error.message : 'Unknown microphone initialization error.',
    recoverable: true,
  };
}

function mapDomExceptionToAudioError(error: DOMException): AudioInputError {
  const blockedReason = getBlockedReason(error.name);

  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return {
        code: blockedReason,
        message: 'Microphone access was denied. Enable microphone permission to continue.',
        recoverable: true,
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        code: blockedReason,
        message: 'No microphone input device was found for this browser session.',
        recoverable: true,
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        code: blockedReason,
        message: 'The microphone is unavailable or already in use by another application.',
        recoverable: true,
      };
    default:
      return {
        code: blockedReason,
        message: error.message || 'The microphone could not be initialized.',
        recoverable: blockedReason !== 'unsupported-browser',
      };
  }
}

function getBlockedReason(name: string): AudioBlockedReason | 'unknown-error' {
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'permission-denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'no-input-device';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'device-unavailable';
    case 'NotSupportedError':
      return 'unsupported-browser';
    default:
      return 'initialization-failed';
  }
}
