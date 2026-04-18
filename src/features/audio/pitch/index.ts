export {
  classifyPitchSample,
  classifyPitchTargetMatch,
  classifyWithConfidence,
  createPitchDetector,
  PERFECT_CENTS,
  SILENCE_THRESHOLD_RMS,
  UNUSABLE_CONFIDENCE_THRESHOLD,
} from './classification';
export { selectPitchTargetSnapshot } from './selectors';
export type {
  PitchClassification,
  PitchDetectionOptions,
  PitchDetectionSample,
  PitchDetectionSampleWithConfidence,
  PitchMonitorConfig,
  PitchMonitorState,
  PitchTargetSnapshot,
  PitchTargetMatchState,
} from './types';
export { DEFAULT_PITCH_MONITOR_CONFIG, usePitchMonitor } from './usePitchMonitor';
