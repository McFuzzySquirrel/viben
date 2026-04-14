import { describe, expect, it } from 'vitest';
import { DEFAULT_SOLFEGE_CALIBRATION, getSolfegeWindow } from '@shared/config/solfege';
import { classifyPitchSample, classifyPitchTargetMatch } from './classification';
import { selectPitchTargetSnapshot } from './selectors';

function createStats(overrides: Partial<{ capturedAt: number; rms: number; peak: number }> = {}) {
  return {
    capturedAt: overrides.capturedAt ?? 123,
    frameSize: 2048,
    sampleRate: 48_000,
    rms: overrides.rms ?? 0.02,
    peak: overrides.peak ?? 0.1,
  };
}

describe('pitch classification', () => {
  it('AC-05 maps stable pitch into the configured solfege window', () => {
    const doWindow = getSolfegeWindow('do');

    expect(doWindow).not.toBeNull();

    const sample = classifyPitchSample(doWindow!.centerFrequencyHz, createStats());

    expect(sample.classification).toBe('note');
    expect(sample.noteId).toBe('do');
    expect(classifyPitchTargetMatch(sample, 'do')).toBe('correct');
  });

  it('AC-06 keeps low-signal input in a missing state', () => {
    const sample = classifyPitchSample(null, createStats({ rms: 0.001 }));

    expect(sample.classification).toBe('silence');
    expect(classifyPitchTargetMatch(sample, 'sol')).toBe('missing');
  });

  it('AC-06 marks noisy unclassified input as unusable instead of a note hit', () => {
    const sample = classifyPitchSample(null, createStats({ rms: 0.05, peak: 0.3 }));
    const target = selectPitchTargetSnapshot(sample, 'la');

    expect(sample.classification).toBe('unusable');
    expect(target.matchState).toBe('missing');
    expect(target.hasUsablePitch).toBe(false);
  });

  it('AC-06 keeps out-of-range notes incorrect for gameplay consumers', () => {
    const sample = classifyPitchSample(
      DEFAULT_SOLFEGE_CALIBRATION.maximumFrequencyHz + 40,
      createStats(),
    );
    const target = selectPitchTargetSnapshot(sample, 'fa');

    expect(sample.classification).toBe('out-of-range');
    expect(sample.noteId).toBeNull();
    expect(target.matchState).toBe('incorrect');
    expect(target.nearestNoteId).not.toBeNull();
  });
});
