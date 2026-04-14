import { useMemo } from 'react';
import { DEFAULT_SOLFEGE_CALIBRATION, type SolfegeCalibrationConfig, type SolfegeNoteId } from '@shared/config/solfege';
import { useAudioInput } from './AudioProvider';
import { selectAudioSetupStatus } from './input';
import { selectPitchTargetSnapshot, usePitchMonitor } from './pitch';

export function useGameplayAudioInput(
  targetNoteId: SolfegeNoteId | null,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
) {
  const microphone = useAudioInput();
  const pitchMonitor = usePitchMonitor(microphone.session, calibration);
  const setup = useMemo(() => selectAudioSetupStatus(microphone.state), [microphone.state]);
  const target = useMemo(
    () => selectPitchTargetSnapshot(pitchMonitor.latestSample, targetNoteId, calibration),
    [calibration, pitchMonitor.latestSample, targetNoteId],
  );

  return {
    ...microphone,
    setup,
    calibration,
    isReadyForGameplay: setup.isReadyForGameplay,
    latestSample: pitchMonitor.latestSample,
    pitchMonitor,
    target,
  };
}
