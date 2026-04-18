import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SOLFEGE_CALIBRATION, SOLFEGE_NOTE_IDS, type SolfegeNoteId } from '@shared/config/solfege';
import { useAudioInput } from '@features/audio/AudioProvider';
import { usePitchMonitor } from '@features/audio/pitch/usePitchMonitor';
import type { PitchDetectionSample } from '@features/audio/pitch/types';
import {
  createInitialCalibrationState,
  type CalibrationState,
  type NoteCalibrationData,
  type VoiceProfile,
} from './types';
import { aggregateCalibrationSamples } from './voice-profile';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface CalibrationCaptureConfig {
  /** Minimum samples needed to accept a note (default: 19 ≈ 1.5s at 80ms). */
  minHoldSamples: number;
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationCaptureConfig = {
  minHoldSamples: 19,
} as const;

// ---------------------------------------------------------------------------
// Result interface
// ---------------------------------------------------------------------------

export interface CalibrationCaptureResult {
  /** Current calibration state — which notes are done/pending. */
  state: CalibrationState;
  /** Raw frequency samples being collected for the current note. */
  currentSamples: ReadonlyArray<number>;
  /** The latest pitch detection sample for live feedback. */
  latestSample: PitchDetectionSample | null;
  /** Whether pitch monitoring is active. */
  isMonitoring: boolean;
  /** Progress through hold requirement (0 to 1). */
  holdProgress: number;
  /** The current target note ID. */
  currentNoteId: SolfegeNoteId | null;
  /** Accept the current note's calibration data and move to next. */
  confirmNote: () => void;
  /** Skip current note (use standard frequency). */
  skipNote: () => void;
  /** Redo a previously captured note. */
  redoNote: (noteId: SolfegeNoteId) => void;
  /** Start capturing for the current note. */
  startCapture: () => void;
  /** Build final voice profile from captured data (null if not all notes captured). */
  buildProfile: () => VoiceProfile | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCalibrationCapture(
  config: CalibrationCaptureConfig = DEFAULT_CALIBRATION_CONFIG,
): CalibrationCaptureResult {
  const { session } = useAudioInput();

  // Use wide default calibration for detection during calibration — we're not
  // matching specific notes, just detecting any stable pitch.
  const pitchMonitor = usePitchMonitor(session, DEFAULT_SOLFEGE_CALIBRATION);

  const [calState, setCalState] = useState<CalibrationState>(createInitialCalibrationState);
  const [samples, setSamples] = useState<number[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Ref to avoid stale closure in the effect that collects samples.
  const samplesRef = useRef(samples);
  samplesRef.current = samples;

  const currentNoteId: SolfegeNoteId | null = calState.isComplete
    ? null
    : SOLFEGE_NOTE_IDS[calState.currentNoteIndex] ?? null;

  // ── Collect frequency samples while capturing ──────────────────────────

  useEffect(() => {
    if (!isCapturing || !pitchMonitor.latestSample) {
      return;
    }

    const sample = pitchMonitor.latestSample;

    // Accept ANY detected frequency — during calibration we record whatever
    // the user sings, even if it doesn't match a predefined solfege window.
    // Silence (null freq) and unusable (null freq) are already excluded by
    // the frequencyHz !== null check.  The global range filter (80–1100 Hz)
    // still applies inside classifyPitchSample, so noise is rejected.
    if (sample.frequencyHz !== null) {
      setSamples((prev) => {
        // Stop collecting once we hit the threshold — the user will
        // confirm or the UI will auto-advance.
        if (prev.length >= config.minHoldSamples) {
          return prev;
        }

        return [...prev, sample.frequencyHz as number];
      });
    }
  }, [isCapturing, pitchMonitor.latestSample, config.minHoldSamples]);

  // ── Hold progress ─────────────────────────────────────────────────────

  const holdProgress = Math.min(1, samples.length / config.minHoldSamples);

  // ── Actions ───────────────────────────────────────────────────────────

  const startCapture = useCallback(() => {
    setSamples([]);
    setIsCapturing(true);

    setCalState((prev) => {
      if (prev.isComplete) return prev;
      const noteId = SOLFEGE_NOTE_IDS[prev.currentNoteIndex];
      if (!noteId) return prev;

      return {
        ...prev,
        noteStatuses: {
          ...prev.noteStatuses,
          [noteId]: 'capturing' as const,
        },
      };
    });
  }, []);

  const advanceToNextNote = useCallback((state: CalibrationState): CalibrationState => {
    const nextIndex = state.currentNoteIndex + 1;
    const isComplete = nextIndex >= SOLFEGE_NOTE_IDS.length;

    return {
      ...state,
      currentNoteIndex: isComplete ? state.currentNoteIndex : nextIndex,
      isComplete,
    };
  }, []);

  const confirmNote = useCallback(() => {
    if (!currentNoteId) return;

    const data = aggregateCalibrationSamples(currentNoteId, samplesRef.current);
    if (!data) return;

    setIsCapturing(false);
    setSamples([]);

    setCalState((prev) => {
      const updated: CalibrationState = {
        ...prev,
        noteStatuses: {
          ...prev.noteStatuses,
          [currentNoteId]: 'captured' as const,
        },
        capturedData: {
          ...prev.capturedData,
          [currentNoteId]: data,
        },
      };

      return advanceToNextNote(updated);
    });
  }, [currentNoteId, advanceToNextNote]);

  const skipNote = useCallback(() => {
    if (!currentNoteId) return;

    setIsCapturing(false);
    setSamples([]);

    setCalState((prev) => {
      const updated: CalibrationState = {
        ...prev,
        noteStatuses: {
          ...prev.noteStatuses,
          [currentNoteId]: 'skipped' as const,
        },
      };

      return advanceToNextNote(updated);
    });
  }, [currentNoteId, advanceToNextNote]);

  const redoNote = useCallback((noteId: SolfegeNoteId) => {
    setIsCapturing(false);
    setSamples([]);

    setCalState((prev) => {
      const index = SOLFEGE_NOTE_IDS.indexOf(noteId);
      if (index === -1) return prev;

      const updatedData = { ...prev.capturedData };
      delete updatedData[noteId];

      return {
        ...prev,
        currentNoteIndex: index,
        noteStatuses: {
          ...prev.noteStatuses,
          [noteId]: 'pending' as const,
        },
        capturedData: updatedData,
        isComplete: false,
      };
    });
  }, []);

  const buildProfile = useCallback((): VoiceProfile | null => {
    // All non-skipped notes must have captured data.
    const notes: Partial<Record<SolfegeNoteId, NoteCalibrationData>> = {};
    let allCaptured = true;

    for (const noteId of SOLFEGE_NOTE_IDS) {
      const data = calState.capturedData[noteId];

      if (!data) {
        // If skipped, we can't build a full profile.
        allCaptured = false;
        break;
      }

      notes[noteId] = data;
    }

    if (!allCaptured) return null;

    const now = new Date().toISOString();

    return {
      version: 1,
      notes: notes as Record<SolfegeNoteId, NoteCalibrationData>,
      createdAt: now,
      updatedAt: now,
    };
  }, [calState.capturedData]);

  return useMemo(
    () => ({
      state: calState,
      currentSamples: samples,
      latestSample: pitchMonitor.latestSample,
      isMonitoring: pitchMonitor.isMonitoring,
      holdProgress,
      currentNoteId,
      confirmNote,
      skipNote,
      redoNote,
      startCapture,
      buildProfile,
    }),
    [
      calState,
      samples,
      pitchMonitor.latestSample,
      pitchMonitor.isMonitoring,
      holdProgress,
      currentNoteId,
      confirmNote,
      skipNote,
      redoNote,
      startCapture,
      buildProfile,
    ],
  );
}
