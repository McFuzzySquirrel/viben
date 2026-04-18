import { describe, expect, it } from 'vitest';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';
import { createInitialCalibrationState } from './types';

describe('createInitialCalibrationState', () => {
  it('returns all 7 notes with pending status', () => {
    const state = createInitialCalibrationState();

    expect(Object.keys(state.noteStatuses)).toHaveLength(SOLFEGE_NOTE_IDS.length);
    expect(SOLFEGE_NOTE_IDS.length).toBe(7);

    for (const noteId of SOLFEGE_NOTE_IDS) {
      expect(state.noteStatuses[noteId]).toBe('pending');
    }
  });

  it('starts with currentNoteIndex at 0', () => {
    const state = createInitialCalibrationState();
    expect(state.currentNoteIndex).toBe(0);
  });

  it('starts with empty capturedData', () => {
    const state = createInitialCalibrationState();
    expect(Object.keys(state.capturedData)).toHaveLength(0);
  });

  it('starts with isComplete set to false', () => {
    const state = createInitialCalibrationState();
    expect(state.isComplete).toBe(false);
  });
});
