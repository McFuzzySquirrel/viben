import { describe, expect, it } from 'vitest';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';
import type { NoteCalibrationData, VoiceProfile } from '@features/calibration/types';
import {
  buildDifficultySolfegeWindows,
  buildVoiceProfileDifficultyWindows,
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_IDS,
  DIFFICULTY_OPTIONS,
  getDifficultyCalibration,
  getDifficultyDefinition,
} from './difficulty';

function createTestVoiceProfile(): VoiceProfile {
  const frequencies: Record<string, number> = {
    do: 250, re: 280, mi: 310, fa: 340, sol: 370, la: 420, ti: 470,
  };

  const notes = Object.fromEntries(
    SOLFEGE_NOTE_IDS.map((id) => [
      id,
      {
        noteId: id,
        medianFrequencyHz: frequencies[id],
        minFrequencyHz: frequencies[id] - 10,
        maxFrequencyHz: frequencies[id] + 10,
        sampleCount: 20,
        capturedAt: '2026-01-01T00:00:00.000Z',
      } satisfies NoteCalibrationData,
    ]),
  ) as Record<(typeof SOLFEGE_NOTE_IDS)[number], NoteCalibrationData>;

  return {
    version: 1,
    notes,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('difficulty config', () => {
  it('exposes stable options in configured order', () => {
    expect(DIFFICULTY_OPTIONS.map((option) => option.id)).toEqual([...DIFFICULTY_IDS]);
    expect(DEFAULT_DIFFICULTY_ID).toBe('easy');
  });

  it('maps difficulty note tolerance into solfege calibration', () => {
    const easyCalibration = getDifficultyCalibration('easy');
    const hardCalibration = getDifficultyCalibration('hard');

    expect(easyCalibration.centsTolerance).toBe(
      getDifficultyDefinition('easy').tuning.noteWindowCentsTolerance,
    );
    expect(hardCalibration.centsTolerance).toBe(
      getDifficultyDefinition('hard').tuning.noteWindowCentsTolerance,
    );
    expect(easyCalibration.centsTolerance).toBeGreaterThan(hardCalibration.centsTolerance);
  });

  it('produces serializable tuning definitions and note windows', () => {
    const serialized = JSON.parse(JSON.stringify(getDifficultyDefinition('normal')));
    const windows = buildDifficultySolfegeWindows('normal');

    expect(serialized.id).toBe('normal');
    expect(windows).toHaveLength(7);
    expect(windows[0]?.minFrequencyHz).toBeLessThan(windows[0]?.maxFrequencyHz ?? 0);
  });

  describe('buildVoiceProfileDifficultyWindows', () => {
    const profile = createTestVoiceProfile();

    it("uses each difficulty's own cents tolerance", () => {
      const easyWindows = buildVoiceProfileDifficultyWindows(profile, 'easy');
      const hardWindows = buildVoiceProfileDifficultyWindows(profile, 'hard');

      // Easy has wider tolerance → wider gap between min and max
      const easySpread = easyWindows[0].maxFrequencyHz - easyWindows[0].minFrequencyHz;
      const hardSpread = hardWindows[0].maxFrequencyHz - hardWindows[0].minFrequencyHz;

      expect(easySpread).toBeGreaterThan(hardSpread);
    });

    it('windows are built from voice profile frequencies, not equal-temperament', () => {
      const windows = buildVoiceProfileDifficultyWindows(profile, 'normal');

      // Each center should match the profile's median frequency
      for (const window of windows) {
        expect(window.centerFrequencyHz).toBe(profile.notes[window.id].medianFrequencyHz);
      }
    });

    it('easy mode produces wider windows than hard mode', () => {
      const easyWindows = buildVoiceProfileDifficultyWindows(profile, 'easy');
      const hardWindows = buildVoiceProfileDifficultyWindows(profile, 'hard');

      for (let i = 0; i < easyWindows.length; i++) {
        // Same center
        expect(easyWindows[i].centerFrequencyHz).toBe(hardWindows[i].centerFrequencyHz);
        // Easy min is lower (wider)
        expect(easyWindows[i].minFrequencyHz).toBeLessThan(hardWindows[i].minFrequencyHz);
        // Easy max is higher (wider)
        expect(easyWindows[i].maxFrequencyHz).toBeGreaterThan(hardWindows[i].maxFrequencyHz);
      }
    });

    it('builds windows from voice profile frequencies, not standard A4 frequencies', () => {
      const customProfile = createTestVoiceProfile();
      // Override 'do' to a frequency far from equal-temperament C4 (~261 Hz)
      customProfile.notes.do = {
        noteId: 'do',
        medianFrequencyHz: 200,
        minFrequencyHz: 195,
        maxFrequencyHz: 205,
        sampleCount: 10,
        capturedAt: '2026-01-01T00:00:00.000Z',
      };

      const windows = buildVoiceProfileDifficultyWindows(customProfile, 'easy');
      const doWindow = windows.find((w) => w.id === 'do');

      expect(doWindow).toBeDefined();
      // Should use the profile's median (200), not the standard ~261 Hz
      expect(doWindow!.centerFrequencyHz).toBe(200);
    });
  });
});
