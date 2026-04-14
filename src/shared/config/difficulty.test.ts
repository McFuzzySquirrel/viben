import { describe, expect, it } from 'vitest';
import {
  buildDifficultySolfegeWindows,
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTY_IDS,
  DIFFICULTY_OPTIONS,
  getDifficultyCalibration,
  getDifficultyDefinition,
} from './difficulty';

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
});
