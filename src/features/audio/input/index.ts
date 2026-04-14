export { createAudioInputSession, DEFAULT_AUDIO_CAPTURE_CONSTRAINTS } from './session';
export { createUnsupportedAudioError, detectAudioInputSupport, queryMicrophonePermission } from './support';
export type {
  AudioBlockedReason,
  AudioCaptureConstraints,
  AudioCaptureMetrics,
  AudioCaptureStats,
  AudioInputCapability,
  AudioInputError,
  AudioInputPermissionState,
  AudioInputSnapshot,
  AudioReadinessState,
  AudioSupportState,
} from './types';
export { useMicrophoneInput, type MicrophoneInputController } from './useMicrophoneInput';
