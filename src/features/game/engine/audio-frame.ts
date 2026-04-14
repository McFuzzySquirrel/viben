import type { PitchDetectionSample, PitchTargetSnapshot } from '@features/audio';
import type { GameplayAudioFrame } from './contracts';

export function createGameplayAudioFrame(
  sample: PitchDetectionSample | null,
  target: PitchTargetSnapshot,
): GameplayAudioFrame {
  return {
    sample,
    matchState: target.matchState,
    targetNoteId: target.targetNoteId,
  };
}
