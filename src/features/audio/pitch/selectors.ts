import { getSolfegeWindow, type SolfegeCalibrationConfig, type SolfegeNoteId, type SolfegeWindow } from '@shared/config/solfege';
import { DEFAULT_SOLFEGE_CALIBRATION } from '@shared/config/solfege';
import { classifyPitchTargetMatch } from './classification';
import type { PitchDetectionSample, PitchTargetSnapshot } from './types';

export function selectPitchTargetSnapshot(
  sample: PitchDetectionSample | null,
  targetNoteId: SolfegeNoteId | null,
  calibration: SolfegeCalibrationConfig = DEFAULT_SOLFEGE_CALIBRATION,
  customWindows?: ReadonlyArray<SolfegeWindow>,
): PitchTargetSnapshot {
  const matchState =
    sample && targetNoteId ? classifyPitchTargetMatch(sample, targetNoteId) : 'missing';
  const targetWindow = targetNoteId
    ? (customWindows?.find((w) => w.id === targetNoteId) ??
      getSolfegeWindow(targetNoteId, calibration))
    : null;
  const centsOffTarget =
    sample?.frequencyHz && targetWindow
      ? 1200 * Math.log2(sample.frequencyHz / targetWindow.centerFrequencyHz)
      : null;

  return {
    targetNoteId,
    matchState,
    classification: sample?.classification ?? null,
    detectedNoteId: sample?.noteId ?? null,
    nearestNoteId: sample?.nearestNoteId ?? null,
    centsOffTarget,
    hasUsablePitch: Boolean(sample && sample.classification === 'note'),
  };
}
