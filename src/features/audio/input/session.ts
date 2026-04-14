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
  const audioContext = new AudioContextConstructor({
    latencyHint: captureConstraints.latencyHint,
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
