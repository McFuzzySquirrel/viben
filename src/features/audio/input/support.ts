import type {
  AudioInputCapability,
  AudioInputError,
  AudioInputPermissionState,
  AudioSupportState,
} from './types';

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function detectAudioInputSupport(): AudioSupportState {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      isSecureContext: false,
      missingCapabilities: ['secure-context', 'media-devices', 'get-user-media', 'web-audio'],
      supportsMediaDevices: false,
      supportsGetUserMedia: false,
      supportsWebAudio: false,
      supportsPermissionsApi: false,
    };
  }

  const windowWithWebkitAudioContext = window as WindowWithWebkitAudioContext;
  const supportsMediaDevices = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
  const supportsGetUserMedia = Boolean(navigator.mediaDevices?.getUserMedia);
  const supportsWebAudio = Boolean(
    'AudioContext' in windowWithWebkitAudioContext ||
      windowWithWebkitAudioContext.webkitAudioContext,
  );

  const missingCapabilities: AudioInputCapability[] = [];

  if (!window.isSecureContext) {
    missingCapabilities.push('secure-context');
  }

  if (!supportsMediaDevices) {
    missingCapabilities.push('media-devices');
  }

  if (!supportsGetUserMedia) {
    missingCapabilities.push('get-user-media');
  }

  if (!supportsWebAudio) {
    missingCapabilities.push('web-audio');
  }

  return {
    isSupported: missingCapabilities.length === 0,
    isSecureContext: window.isSecureContext,
    missingCapabilities,
    supportsMediaDevices,
    supportsGetUserMedia,
    supportsWebAudio,
    supportsPermissionsApi: Boolean(navigator.permissions?.query),
  };
}

export async function queryMicrophonePermission(
  support: AudioSupportState,
): Promise<AudioInputPermissionState> {
  if (!support.isSupported) {
    return 'unsupported';
  }

  if (!support.supportsPermissionsApi) {
    return 'prompt';
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });

    switch (permissionStatus.state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'prompt';
    }
  } catch {
    return 'prompt';
  }
}

export function createUnsupportedAudioError(support: AudioSupportState): AudioInputError {
  if (!support.isSecureContext) {
    return {
      code: 'insecure-context',
      message: 'Microphone access requires a secure browser context (HTTPS or localhost).',
      recoverable: false,
    };
  }

  return {
    code: 'unsupported-browser',
    message: `This browser is missing audio requirements: ${support.missingCapabilities.join(', ')}.`,
    recoverable: false,
  };
}
