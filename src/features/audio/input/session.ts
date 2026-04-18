import type { AudioCaptureConstraints, AudioCaptureMetrics, AudioCaptureStats } from './types';

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface AudioFrame {
  timeDomainData: Float32Array;
  stats: AudioCaptureStats;
}

export interface AudioInputSession {
  metrics: AudioCaptureMetrics;
  ensureRunning: () => Promise<void>;
  readFrame: () => AudioFrame;
  close: () => Promise<void>;
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
// • autoGainControl: false  – AGC can distort sustained notes.
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
): Promise<AudioInputSession> {
  const captureConstraints = {
    ...DEFAULT_AUDIO_CAPTURE_CONSTRAINTS,
    ...overrides,
    audio: {
      ...DEFAULT_AUDIO_CAPTURE_CONSTRAINTS.audio,
      ...overrides.audio,
    },
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

  const metrics: AudioCaptureMetrics = {
    sampleRate: audioContext.sampleRate,
    frameSize: analyser.fftSize,
    latencyHint: captureConstraints.latencyHint,
  };

  return {
    metrics,
    ensureRunning: async () => {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
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
