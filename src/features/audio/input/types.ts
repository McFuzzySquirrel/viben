export type AudioInputCapability =
  | 'secure-context'
  | 'media-devices'
  | 'get-user-media'
  | 'web-audio';

export type AudioInputPermissionState =
  | 'idle'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error';

export type AudioReadinessState = 'idle' | 'ready' | 'capturing' | 'blocked' | 'error';

export type AudioSetupStage =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'capturing'
  | 'blocked'
  | 'error';

export type AudioBlockedReason =
  | 'unsupported-browser'
  | 'insecure-context'
  | 'permission-denied'
  | 'no-input-device'
  | 'device-unavailable'
  | 'initialization-failed';

export interface AudioSupportState {
  isSupported: boolean;
  isSecureContext: boolean;
  missingCapabilities: AudioInputCapability[];
  supportsMediaDevices: boolean;
  supportsGetUserMedia: boolean;
  supportsWebAudio: boolean;
  supportsPermissionsApi: boolean;
}

export interface AudioInputError {
  code: AudioBlockedReason | 'unknown-error';
  message: string;
  recoverable: boolean;
}

export interface AudioCaptureConstraints {
  audio: MediaTrackConstraints;
  analyserFftSize: number;
  analyserSmoothingTimeConstant: number;
  latencyHint: AudioContextLatencyCategory;
}

export interface AudioCaptureMetrics {
  sampleRate: number;
  frameSize: number;
  latencyHint: AudioContextLatencyCategory;
}

export interface AudioCaptureStats {
  capturedAt: number;
  frameSize: number;
  sampleRate: number;
  rms: number;
  peak: number;
}

export interface AudioInputSnapshot {
  support: AudioSupportState;
  permission: AudioInputPermissionState;
  readiness: AudioReadinessState;
  blockedReason: AudioBlockedReason | null;
  isCapturing: boolean;
  captureMetrics: AudioCaptureMetrics | null;
  lastError: AudioInputError | null;
}

export interface AudioSetupStatus {
  stage: AudioSetupStage;
  blockedReason: AudioBlockedReason | null;
  isBlocked: boolean;
  isListening: boolean;
  isReadyForGameplay: boolean;
  canRequestAccess: boolean;
  canRetry: boolean;
}
