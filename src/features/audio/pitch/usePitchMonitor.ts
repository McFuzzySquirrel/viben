import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SOLFEGE_CALIBRATION, type SolfegeCalibrationConfig } from '@shared/config/solfege';
import type { AudioInputSession } from '@features/audio/input/session';
import { classifyPitchSample, createPitchDetector, DEFAULT_PITCH_DETECTION_OPTIONS } from './classification';
import type { PitchDetectionSample, PitchDetectionOptions, PitchMonitorConfig, PitchMonitorState } from './types';

// ---------------------------------------------------------------------------
// NF-01  Latency budget documentation
// ---------------------------------------------------------------------------
// The full audio-to-feedback path must stay under 150 ms (median).
//
// Budget breakdown:
//   ┌──────────────────────┬──────────────────────┐
//   │ Stage                │ Estimated cost (ms)  │
//   ├──────────────────────┼──────────────────────┤
//   │ Mic capture (HW)     │ ~10–25               │
//   │ AudioContext buffer   │ ~5–20 (interactive)  │
//   │ YIN pitch analysis    │ ~2–5 (2048 samples)  │
//   │ Classification        │ < 1                  │
//   │ React state update    │ ~5–15                │
//   │ RAF/interval wait     │ 0–analysisIntervalMs │
//   └──────────────────────┴──────────────────────┘
//
// With `analysisIntervalMs = 80` the *worst-case* interval contribution
// is 80 ms, yielding a total ≤ 140 ms.  Median is roughly half that
// because the timer fires asynchronously relative to capture.
//
// Using `setInterval` instead of `requestAnimationFrame` ensures the
// analysis loop runs at a consistent cadence regardless of whether the
// browser tab is in the foreground — `rAF` is throttled to ≤ 1 fps in
// background tabs, which would violate NF-01.
// ---------------------------------------------------------------------------

/** Default analysis interval targeting 80 ms (≈ 12.5 analyses/sec). */
export const DEFAULT_PITCH_MONITOR_CONFIG: PitchMonitorConfig = {
  analysisIntervalMs: 80,
} as const;

export function usePitchMonitor(
  session: AudioInputSession | null,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
  monitorConfig: PitchMonitorConfig = DEFAULT_PITCH_MONITOR_CONFIG,
): PitchMonitorState {
  const [latestSample, setLatestSample] = useState<PitchDetectionSample | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    };

    // Use setInterval for consistent cadence. Unlike rAF, setInterval is
    // not throttled in background tabs and gives us explicit control over
    // the analysis rate to meet the NF-01 latency budget.
    intervalRef.current = setInterval(tick, monitorConfig.analysisIntervalMs);

    // Fire the first tick immediately so the consumer doesn't have to
    // wait a full interval before receiving the first sample.
    tick();

    return () => {
      isActive = false;

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    calibration,
    detector,
    monitorConfig.analysisIntervalMs,
    session,
  ]);

  return {
    calibration,
    isMonitoring: session !== null,
    latestSample,
  };
}
