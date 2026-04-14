import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SOLFEGE_CALIBRATION, type SolfegeCalibrationConfig } from '@shared/config/solfege';
import type { AudioInputSession } from '@features/audio/input/session';
import { classifyPitchSample, createPitchDetector, DEFAULT_PITCH_DETECTION_OPTIONS } from './classification';
import type { PitchDetectionSample, PitchDetectionOptions, PitchMonitorState } from './types';

export function usePitchMonitor(
  session: AudioInputSession | null,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
): PitchMonitorState {
  const [latestSample, setLatestSample] = useState<PitchDetectionSample | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const detector = useMemo(
    () =>
      createPitchDetector({
        ...DEFAULT_PITCH_DETECTION_OPTIONS,
        ...calibration,
      } satisfies Partial<PitchDetectionOptions>),
    [
      calibration.centsTolerance,
      calibration.maximumFrequencyHz,
      calibration.minimumFrequencyHz,
      calibration.minimumSignalRms,
      calibration.referenceFrequencyHz,
    ],
  );

  useEffect(() => {
    if (!session) {
      setLatestSample(null);
      return undefined;
    }

    let isActive = true;

    const tick = () => {
      if (!isActive) {
        return;
      }

      const frame = session.readFrame();
      const frequencyHz = detector(frame.timeDomainData) ?? null;
      setLatestSample(classifyPitchSample(frequencyHz, frame.stats, calibration));
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      isActive = false;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    calibration,
    detector,
    session,
  ]);

  return {
    calibration,
    isMonitoring: session !== null,
    latestSample,
  };
}
