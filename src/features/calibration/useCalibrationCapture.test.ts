import { vi, describe, expect, it, beforeEach, type Mock } from 'vitest';
import type { PitchDetectionSample } from '@features/audio/pitch/types';
import type { SolfegeCalibrationConfig } from '@shared/config/solfege';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before importing the hook under test
// ---------------------------------------------------------------------------

const mockRequestMicrophoneAccess = vi.fn();

vi.mock('@features/audio/AudioProvider', () => ({
  useAudioInput: vi.fn(() => ({
    session: null,
    state: {},
    requestMicrophoneAccess: mockRequestMicrophoneAccess,
  })),
}));

let latestSampleRef: { current: PitchDetectionSample | null } = { current: null };

vi.mock('@features/audio/pitch/usePitchMonitor', () => ({
  usePitchMonitor: vi.fn(
    (_session: unknown, _calibration?: SolfegeCalibrationConfig) => ({
      latestSample: latestSampleRef.current,
      isMonitoring: false,
      calibration: {},
    }),
  ),
}));

// Import hook *after* mocks are in place
import { renderHook, act } from '@testing-library/react';
import {
  useCalibrationCapture,
  DEFAULT_CALIBRATION_CONFIG,
} from './useCalibrationCapture';
import { MIN_CALIBRATION_SAMPLES } from './voice-profile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a realistic PitchDetectionSample that classifies as a detected note.
 */
function createNoteSample(frequencyHz: number): PitchDetectionSample {
  return {
    capturedAt: Date.now(),
    frequencyHz,
    rms: 0.1,
    peak: 0.5,
    classification: 'note',
    noteId: 'do', // classification value doesn't matter for capture
    nearestNoteId: 'do',
    centsFromNearest: 0,
    matchedWindow: null,
  };
}

/**
 * Push `count` note samples through the hook by mutating the latestSample
 * ref and re-rendering. Each sample is fed in its own `act()` so React
 * flushes the collection effect individually.
 */
function feedSamples(
  rerender: () => void,
  count: number,
  baseFrequency = 250,
) {
  for (let i = 0; i < count; i++) {
    act(() => {
      latestSampleRef.current = createNoteSample(baseFrequency + i * 0.1);
      rerender();
    });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCalibrationCapture', () => {
  beforeEach(() => {
    latestSampleRef.current = null;
  });

  // ── Initial state ─────────────────────────────────────────────────────

  it('initial state has currentNoteId "do", holdProgress 0, isComplete false', () => {
    const { result } = renderHook(() => useCalibrationCapture());

    expect(result.current.currentNoteId).toBe('do');
    expect(result.current.holdProgress).toBe(0);
    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.currentSamples).toHaveLength(0);
  });

  it('all notes start with "pending" status', () => {
    const { result } = renderHook(() => useCalibrationCapture());

    for (const noteId of SOLFEGE_NOTE_IDS) {
      expect(result.current.state.noteStatuses[noteId]).toBe('pending');
    }
  });

  // ── startCapture ──────────────────────────────────────────────────────

  it('startCapture sets current note status to "capturing"', () => {
    const { result } = renderHook(() => useCalibrationCapture());

    act(() => {
      result.current.startCapture();
    });

    expect(result.current.state.noteStatuses.do).toBe('capturing');
  });

  // ── confirmNote ───────────────────────────────────────────────────────

  it('confirmNote with valid samples advances to next note', () => {
    const minSamples = MIN_CALIBRATION_SAMPLES;
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    // Start capturing
    act(() => {
      result.current.startCapture();
    });

    // Feed enough samples to meet MIN_CALIBRATION_SAMPLES
    feedSamples(rerender, minSamples, 250);

    // Confirm
    act(() => {
      result.current.confirmNote();
    });

    expect(result.current.state.noteStatuses.do).toBe('captured');
    expect(result.current.currentNoteId).toBe('re');
    expect(result.current.state.capturedData.do).toBeDefined();
    expect(result.current.state.capturedData.do!.noteId).toBe('do');
  });

  it('confirmNote is a no-op when not enough samples', () => {
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    act(() => {
      result.current.startCapture();
    });

    // Feed too few samples
    feedSamples(rerender, MIN_CALIBRATION_SAMPLES - 1, 250);

    act(() => {
      result.current.confirmNote();
    });

    // Should still be on 'do' with capturing status
    expect(result.current.currentNoteId).toBe('do');
    expect(result.current.state.noteStatuses.do).toBe('capturing');
  });

  // ── skipNote ──────────────────────────────────────────────────────────

  it('skipNote marks note as "skipped" and advances to next note', () => {
    const { result } = renderHook(() => useCalibrationCapture());

    act(() => {
      result.current.skipNote();
    });

    expect(result.current.state.noteStatuses.do).toBe('skipped');
    expect(result.current.currentNoteId).toBe('re');
  });

  it('skipping all notes marks calibration as complete', () => {
    const { result } = renderHook(() => useCalibrationCapture());

    for (let i = 0; i < SOLFEGE_NOTE_IDS.length; i++) {
      act(() => {
        result.current.skipNote();
      });
    }

    expect(result.current.state.isComplete).toBe(true);
  });

  // ── redoNote ──────────────────────────────────────────────────────────

  it('redoNote resets a note to pending and moves currentNoteIndex back', () => {
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    // Capture 'do' first
    act(() => {
      result.current.startCapture();
    });
    feedSamples(rerender, MIN_CALIBRATION_SAMPLES, 250);
    act(() => {
      result.current.confirmNote();
    });

    expect(result.current.currentNoteId).toBe('re');
    expect(result.current.state.noteStatuses.do).toBe('captured');

    // Redo 'do'
    act(() => {
      result.current.redoNote('do');
    });

    expect(result.current.currentNoteId).toBe('do');
    expect(result.current.state.noteStatuses.do).toBe('pending');
    expect(result.current.state.capturedData.do).toBeUndefined();
    expect(result.current.state.isComplete).toBe(false);
  });

  it('redoNote clears isComplete when called on a completed flow', () => {
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    // Skip all notes to reach isComplete
    for (let i = 0; i < SOLFEGE_NOTE_IDS.length; i++) {
      act(() => {
        result.current.skipNote();
      });
    }
    expect(result.current.state.isComplete).toBe(true);

    // Redo the last note
    act(() => {
      result.current.redoNote('ti');
    });

    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.currentNoteId).toBe('ti');
    expect(result.current.state.noteStatuses.ti).toBe('pending');
  });

  // ── buildProfile ──────────────────────────────────────────────────────

  it('buildProfile returns null when any notes are skipped', () => {
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    // Capture first note, skip the rest
    act(() => {
      result.current.startCapture();
    });
    feedSamples(rerender, MIN_CALIBRATION_SAMPLES, 250);
    act(() => {
      result.current.confirmNote();
    });

    // Skip remaining notes
    for (let i = 1; i < SOLFEGE_NOTE_IDS.length; i++) {
      act(() => {
        result.current.skipNote();
      });
    }

    const profile = result.current.buildProfile();
    expect(profile).toBeNull();
  });

  it('buildProfile returns a VoiceProfile when all notes are captured', () => {
    const { result, rerender } = renderHook(() => useCalibrationCapture());

    // Capture all 7 notes
    for (let noteIdx = 0; noteIdx < SOLFEGE_NOTE_IDS.length; noteIdx++) {
      act(() => {
        result.current.startCapture();
      });
      feedSamples(rerender, MIN_CALIBRATION_SAMPLES, 200 + noteIdx * 30);
      act(() => {
        result.current.confirmNote();
      });
    }

    expect(result.current.state.isComplete).toBe(true);

    const profile = result.current.buildProfile();
    expect(profile).not.toBeNull();
    expect(profile!.version).toBe(1);
    expect(profile!.createdAt).toBeTruthy();
    expect(profile!.updatedAt).toBeTruthy();

    // Every solfege note should have calibration data
    for (const noteId of SOLFEGE_NOTE_IDS) {
      expect(profile!.notes[noteId]).toBeDefined();
      expect(profile!.notes[noteId].noteId).toBe(noteId);
      expect(profile!.notes[noteId].sampleCount).toBeGreaterThanOrEqual(
        MIN_CALIBRATION_SAMPLES,
      );
    }
  });

  // ── holdProgress ──────────────────────────────────────────────────────

  it('holdProgress correctly reflects samples.length / minHoldSamples', () => {
    const customConfig = { minHoldSamples: 10 };
    const { result, rerender } = renderHook(() =>
      useCalibrationCapture(customConfig),
    );

    act(() => {
      result.current.startCapture();
    });

    expect(result.current.holdProgress).toBe(0);

    // Feed 5 samples → 50% progress
    feedSamples(rerender, 5, 250);
    expect(result.current.holdProgress).toBe(0.5);

    // Feed 5 more → 100% (clamped at 1)
    feedSamples(rerender, 5, 251);
    expect(result.current.holdProgress).toBe(1);
  });

  it('holdProgress is clamped to 1 even when more samples arrive', () => {
    const customConfig = { minHoldSamples: 5 };
    const { result, rerender } = renderHook(() =>
      useCalibrationCapture(customConfig),
    );

    act(() => {
      result.current.startCapture();
    });

    // Feed 10 samples, but minHoldSamples is only 5
    feedSamples(rerender, 10, 250);

    // The hook caps sample collection at minHoldSamples, so progress stays at 1
    expect(result.current.holdProgress).toBe(1);
  });

  // ── out-of-range acceptance ─────────────────────────────────────────

  it('collects samples classified as out-of-range (not just note)', () => {
    const customConfig = { minHoldSamples: 5 };
    const { result, rerender } = renderHook(() =>
      useCalibrationCapture(customConfig),
    );

    act(() => {
      result.current.startCapture();
    });

    // Feed out-of-range samples (frequency outside predefined windows
    // but within global bounds — this is the calibration use case)
    for (let i = 0; i < 5; i++) {
      act(() => {
        latestSampleRef.current = {
          capturedAt: Date.now(),
          frequencyHz: 180 + i * 0.1, // 180 Hz doesn't match any standard window
          rms: 0.1,
          peak: 0.5,
          classification: 'out-of-range',
          noteId: null,
          nearestNoteId: 'do',
          centsFromNearest: -200,
          matchedWindow: null,
        };
        rerender();
      });
    }

    expect(result.current.currentSamples.length).toBe(5);
    expect(result.current.holdProgress).toBe(1);
  });

  // ── DEFAULT_CALIBRATION_CONFIG ────────────────────────────────────────

  it('exports DEFAULT_CALIBRATION_CONFIG with expected minHoldSamples', () => {
    expect(DEFAULT_CALIBRATION_CONFIG.minHoldSamples).toBe(19);
  });
});
