import type { AudioCaptureConstraints, AudioCaptureMetrics, AudioCaptureStats } from './types';

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface AudioFrame {
  timeDomainData: Float32Array;
  stats: AudioCaptureStats;
}

export interface AudioInputSessionOptions {
  /** Called when the AudioContext recovers from a suspended state (e.g. after a background tab). */
  onAudioResumed?: () => void;
}

export interface AudioInputSession {
  metrics: AudioCaptureMetrics;
  ensureRunning: () => Promise<void>;
  readFrame: () => AudioFrame;
  close: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Mobile device detection (FT-FR-11)
// ---------------------------------------------------------------------------
// Uses `navigator.maxTouchPoints` rather than user-agent sniffing, per
// Feature PRD Section 13 Q4.  Mobile devices report ≥ 1 touch points.
// ---------------------------------------------------------------------------

export function isMobileDevice(): boolean {
  return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
}

// ---------------------------------------------------------------------------
// Gesture-gated AudioContext resume (FT-FR-10)
// ---------------------------------------------------------------------------
// iOS Safari (and some other mobile browsers) block AudioContext playback
// until a user gesture has occurred.  `resumeOnGesture` attaches a one-shot
// click/touchstart listener that calls `audioContext.resume()` and resolves
// the returned promise once the context is running.
//
// If the context is already running the promise resolves immediately with
// no DOM side-effects.
// ---------------------------------------------------------------------------

export function resumeOnGesture(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'running') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const handleGesture = () => {
      document.removeEventListener('click', handleGesture, true);
      document.removeEventListener('touchstart', handleGesture, true);

      void audioContext.resume().then(() => {
        resolve();
      });
    };

    document.addEventListener('click', handleGesture, { capture: true, once: false });
    document.addEventListener('touchstart', handleGesture, { capture: true, once: false });

    // Also check for a race where the context resumed between our check and
    // listener registration.
    if (audioContext.state === 'running') {
      document.removeEventListener('click', handleGesture, true);
      document.removeEventListener('touchstart', handleGesture, true);
      resolve();
    }
  });
}

// ---------------------------------------------------------------------------
// Default capture constraints (NF-01 / AC-04)
// ---------------------------------------------------------------------------
// The constraints are tuned for low-latency singing / solfege input:
//
// • channelCount: 1         – mono is sufficient and halves buffer sizes.
// • echoCancellation: false – disables the browser's echo canceller which
//                             adds ~20-40 ms of latency (we don't play back
//                             audio, so echo is not a concern).
// • noiseSuppression: false – the browser's noise gate can clip quiet
//                             singing.  We handle noise at the classification
//                             layer using RMS thresholds.
// • autoGainControl: false  – AGC can distort sustained notes on desktop;
//                             on mobile the default flips to `true` because
//                             built-in phone mics benefit from AGC (FT-FR-11).
// • analyserFftSize: 2048   – yields 2048 time-domain samples per frame.
//                             At 48 kHz this is ~42 ms of audio — enough
//                             for reliable YIN pitch detection down to
//                             ~80 Hz while keeping the buffer small.
// • smoothingTimeConstant: 0.1 – minimal smoothing so the analyser reacts
//                             quickly to new pitch onsets.
// • latencyHint: 'interactive' – requests the lowest scheduling latency
//                             the platform can provide.
// ---------------------------------------------------------------------------

export const DEFAULT_AUDIO_CAPTURE_CONSTRAINTS: AudioCaptureConstraints = {
  audio: {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
  analyserFftSize: 2048,
  analyserSmoothingTimeConstant: 0.1,
  latencyHint: 'interactive',
} as const;

// ---------------------------------------------------------------------------
// Audio pipeline chain
// ---------------------------------------------------------------------------
// The live capture pipeline is wired as:
//
//   getUserMedia (MediaStream)
//     └─► MediaStreamSource
//           └─► AnalyserNode (FFT 2048, no output)
//
// The AnalyserNode is a *tap* — it does not forward audio to the
// destination so nothing is played through the speakers.
//
// On each analysis tick the pitch monitor calls `readFrame()` which:
//   1. Copies the current time-domain buffer from the AnalyserNode.
//   2. Computes RMS and peak stats in a single O(n) pass.
//   3. Returns an `AudioFrame` that the YIN detector consumes.
//
// No raw audio data is stored, persisted, or transmitted (SP-02 / SP-06).
// ---------------------------------------------------------------------------

export async function createAudioInputSession(
  overrides: Partial<AudioCaptureConstraints> = {},
  options: AudioInputSessionOptions = {},
): Promise<AudioInputSession> {
  // FT-FR-11 — mobile-aware autoGainControl default.  If the caller hasn't
  // explicitly set `autoGainControl`, use `true` on mobile (phone mics
  // benefit from AGC) and `false` on desktop (external mics don't).
  const mobileAwareAudio: MediaTrackConstraints = {
    ...DEFAULT_AUDIO_CAPTURE_CONSTRAINTS.audio,
    autoGainControl: isMobileDevice(),
    ...overrides.audio,
  };

  const captureConstraints: AudioCaptureConstraints = {
    ...DEFAULT_AUDIO_CAPTURE_CONSTRAINTS,
    ...overrides,
    audio: mobileAwareAudio,
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: captureConstraints.audio,
    video: false,
  });

  const AudioContextConstructor = getAudioContextConstructor();

  // NF-01 — `latencyHint: 'interactive'` requests the lowest scheduling
  // latency the platform offers (typically 256-sample blocks ≈ 5 ms at
  // 48 kHz).  We also pass `sampleRate` when the stream provides it so
  // the AudioContext does not need to resample.
  const streamSampleRate = stream.getAudioTracks()[0]?.getSettings?.().sampleRate;
  const audioContext = new AudioContextConstructor({
    latencyHint: captureConstraints.latencyHint,
    ...(streamSampleRate ? { sampleRate: streamSampleRate } : {}),
  });
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  const timeDomainData = new Float32Array(captureConstraints.analyserFftSize);

  analyser.fftSize = captureConstraints.analyserFftSize;
  analyser.smoothingTimeConstant = captureConstraints.analyserSmoothingTimeConstant;
  source.connect(analyser);

  // FT-FR-10 — kick-start a suspended AudioContext (iOS Safari gesture gate).
  if (audioContext.state === 'suspended') {
    void resumeOnGesture(audioContext);
  }

  // -------------------------------------------------------------------------
  // Background-tab recovery (visibilitychange)
  // -------------------------------------------------------------------------
  // When the user switches back to the tab, the AudioContext may have been
  // suspended by the browser.  Re-resume it and notify the caller so they
  // can show a brief "Audio resumed" indicator (Section 13 Q5).
  // -------------------------------------------------------------------------
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && audioContext.state === 'suspended') {
      void audioContext.resume().then(() => {
        options.onAudioResumed?.();
      });
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  const metrics: AudioCaptureMetrics = {
    sampleRate: audioContext.sampleRate,
    frameSize: analyser.fftSize,
    latencyHint: captureConstraints.latencyHint,
  };

  return {
    metrics,
    ensureRunning: async () => {
      if (audioContext.state === 'suspended') {
        // First attempt: direct resume (works on most browsers).
        await audioContext.resume();

        // FT-FR-10 fallback — if the context is still suspended after
        // resume() (iOS gesture gate), wait for a user gesture.
        if (audioContext.state === 'suspended') {
          await resumeOnGesture(audioContext);
        }
      }
    },
    readFrame: () => {
      analyser.getFloatTimeDomainData(timeDomainData);

      let total = 0;
      let peak = 0;

      for (let index = 0; index < timeDomainData.length; index += 1) {
        const amplitude = timeDomainData[index];
        total += amplitude * amplitude;
        peak = Math.max(peak, Math.abs(amplitude));
      }

      return {
        timeDomainData,
        stats: {
          capturedAt: performance.now(),
          frameSize: timeDomainData.length,
          sampleRate: audioContext.sampleRate,
          rms: Math.sqrt(total / timeDomainData.length),
          peak,
        },
      };
    },
    close: async () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());

      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
    },
  };
}

function getAudioContextConstructor() {
  const windowWithWebkitAudioContext = window as WindowWithWebkitAudioContext;
  const AudioContextConstructor = window.AudioContext ?? windowWithWebkitAudioContext.webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error('Web Audio API is not available in this browser.');
  }

  return AudioContextConstructor;
}
