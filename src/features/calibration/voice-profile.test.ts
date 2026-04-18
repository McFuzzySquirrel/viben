import { describe, expect, it } from 'vitest';
import {
  SOLFEGE_NOTE_DEFINITIONS,
  SOLFEGE_NOTE_IDS,
  toFrequencyOffset,
} from '@shared/config/solfege';
import type { NoteCalibrationData, VoiceProfile } from './types';
import {
  aggregateCalibrationSamples,
  buildSolfegeWindowsFromVoiceProfile,
  computeMedian,
  MIN_CALIBRATION_SAMPLES,
} from './voice-profile';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestVoiceProfile(
  frequencies: Record<string, number> = {
    do: 250,
    re: 280,
    mi: 310,
    fa: 340,
    sol: 370,
    la: 420,
    ti: 470,
  },
): VoiceProfile {
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

// ---------------------------------------------------------------------------
// computeMedian
// ---------------------------------------------------------------------------

describe('computeMedian', () => {
  it('returns the middle element for odd-length arrays', () => {
    expect(computeMedian([1, 2, 3])).toBe(2);
    expect(computeMedian([10, 20, 30, 40, 50])).toBe(30);
  });

  it('returns the average of two middle elements for even-length arrays', () => {
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
    expect(computeMedian([10, 20])).toBe(15);
  });

  it('works with a single-element array', () => {
    expect(computeMedian([42])).toBe(42);
  });

  it('throws on an empty array', () => {
    expect(() => computeMedian([])).toThrow('Cannot compute median of an empty array.');
  });
});

// ---------------------------------------------------------------------------
// aggregateCalibrationSamples
// ---------------------------------------------------------------------------

describe('aggregateCalibrationSamples', () => {
  it('returns null when fewer than MIN_CALIBRATION_SAMPLES samples are provided', () => {
    expect(aggregateCalibrationSamples('do', [100, 200])).toBeNull();
    expect(aggregateCalibrationSamples('do', [100, 200, 300, 400])).toBeNull();
    expect(aggregateCalibrationSamples('do', [])).toBeNull();
  });

  it('returns valid NoteCalibrationData with exactly MIN_CALIBRATION_SAMPLES samples', () => {
    const samples = [200, 220, 210, 230, 215];
    const result = aggregateCalibrationSamples('re', samples);

    expect(result).not.toBeNull();
    expect(result!.noteId).toBe('re');
    expect(result!.sampleCount).toBe(5);
  });

  it('computes correct median, min, max from unsorted input', () => {
    // Unsorted input: sorted → [100, 150, 200, 250, 300]
    const samples = [250, 100, 200, 300, 150];
    const result = aggregateCalibrationSamples('mi', samples);

    expect(result).not.toBeNull();
    expect(result!.medianFrequencyHz).toBe(200); // Middle of 5 sorted values
    expect(result!.minFrequencyHz).toBe(100);
    expect(result!.maxFrequencyHz).toBe(300);
  });

  it('computes correct median for even-length sample sets', () => {
    // sorted → [100, 150, 200, 250, 300, 350]
    const samples = [300, 100, 250, 150, 200, 350];
    const result = aggregateCalibrationSamples('fa', samples);

    expect(result).not.toBeNull();
    expect(result!.medianFrequencyHz).toBe(225); // avg(200, 250)
  });

  it('returns the correct noteId in the output', () => {
    const samples = [100, 110, 120, 130, 140];
    const result = aggregateCalibrationSamples('sol', samples);

    expect(result).not.toBeNull();
    expect(result!.noteId).toBe('sol');
  });

  it('has a valid ISO-8601 timestamp in capturedAt', () => {
    const samples = [100, 110, 120, 130, 140];
    const result = aggregateCalibrationSamples('la', samples);

    expect(result).not.toBeNull();
    // Valid ISO string should be parseable and not NaN
    const parsed = Date.parse(result!.capturedAt);
    expect(Number.isNaN(parsed)).toBe(false);
    // Should look like an ISO-8601 string
    expect(result!.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('confirms MIN_CALIBRATION_SAMPLES is 5', () => {
    expect(MIN_CALIBRATION_SAMPLES).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// buildSolfegeWindowsFromVoiceProfile
// ---------------------------------------------------------------------------

describe('buildSolfegeWindowsFromVoiceProfile', () => {
  const profile = createTestVoiceProfile();
  const centsTolerance = 50;

  it('returns 7 windows (one per solfege note)', () => {
    const windows = buildSolfegeWindowsFromVoiceProfile(profile, centsTolerance);
    expect(windows).toHaveLength(7);
  });

  it("each window's centerFrequencyHz matches the profile's median frequency", () => {
    const windows = buildSolfegeWindowsFromVoiceProfile(profile, centsTolerance);

    for (const window of windows) {
      const noteData = profile.notes[window.id];
      expect(window.centerFrequencyHz).toBe(noteData.medianFrequencyHz);
    }
  });

  it('each window encompasses both tolerance bounds and captured range', () => {
    const windows = buildSolfegeWindowsFromVoiceProfile(profile, centsTolerance);

    for (const window of windows) {
      const center = window.centerFrequencyHz;
      const expectedMin = toFrequencyOffset(center, -centsTolerance);
      const expectedMax = toFrequencyOffset(center, centsTolerance);
      const captured = profile.notes[window.id];

      // Window must include at least the tolerance-derived bounds
      expect(window.minFrequencyHz).toBeLessThanOrEqual(expectedMin);
      expect(window.maxFrequencyHz).toBeGreaterThanOrEqual(expectedMax);
      // Window must also include the captured range
      expect(window.minFrequencyHz).toBeLessThanOrEqual(captured.minFrequencyHz);
      expect(window.maxFrequencyHz).toBeGreaterThanOrEqual(captured.maxFrequencyHz);
      // Sanity: min < center < max
      expect(window.minFrequencyHz).toBeLessThan(center);
      expect(window.maxFrequencyHz).toBeGreaterThan(center);
    }
  });

  it('window metadata matches canonical note definitions', () => {
    const windows = buildSolfegeWindowsFromVoiceProfile(profile, centsTolerance);

    for (let i = 0; i < windows.length; i++) {
      const window = windows[i];
      const definition = SOLFEGE_NOTE_DEFINITIONS[i];

      expect(window.id).toBe(definition.id);
      expect(window.label).toBe(definition.label);
      expect(window.scientificPitch).toBe(definition.scientificPitch);
      expect(window.semitoneOffsetFromA4).toBe(definition.semitoneOffsetFromA4);
    }
  });

  it('different cents tolerances produce different min/max bounds with narrow captured range', () => {
    // Use narrow captured range so tolerance is the deciding factor
    const narrowProfile = createTestVoiceProfile();
    for (const id of SOLFEGE_NOTE_IDS) {
      narrowProfile.notes[id] = {
        ...narrowProfile.notes[id],
        minFrequencyHz: narrowProfile.notes[id].medianFrequencyHz - 1,
        maxFrequencyHz: narrowProfile.notes[id].medianFrequencyHz + 1,
      };
    }

    const narrowWindows = buildSolfegeWindowsFromVoiceProfile(narrowProfile, 25);
    const wideWindows = buildSolfegeWindowsFromVoiceProfile(narrowProfile, 75);

    for (let i = 0; i < narrowWindows.length; i++) {
      // Same center frequency
      expect(narrowWindows[i].centerFrequencyHz).toBe(wideWindows[i].centerFrequencyHz);
      // Narrow has tighter bounds
      expect(narrowWindows[i].minFrequencyHz).toBeGreaterThan(wideWindows[i].minFrequencyHz);
      expect(narrowWindows[i].maxFrequencyHz).toBeLessThan(wideWindows[i].maxFrequencyHz);
    }
  });

  it('clips windows to geometric midpoints between adjacent notes', () => {
    // Create a profile with overlapping captured ranges
    const overlappingProfile = createTestVoiceProfile({
      do: 250, re: 260, mi: 310, fa: 340, sol: 370, la: 420, ti: 470,
    });
    // Make captured ranges very wide so they'd overlap without clipping
    overlappingProfile.notes.do.minFrequencyHz = 230;
    overlappingProfile.notes.do.maxFrequencyHz = 270;
    overlappingProfile.notes.re.minFrequencyHz = 240;
    overlappingProfile.notes.re.maxFrequencyHz = 280;

    const windows = buildSolfegeWindowsFromVoiceProfile(overlappingProfile, 50);
    const doWindow = windows.find((w) => w.id === 'do')!;
    const reWindow = windows.find((w) => w.id === 're')!;

    // The geometric midpoint between do (250) and re (260) = sqrt(250*260) ≈ 254.95
    const midpoint = Math.sqrt(250 * 260);
    // do's max should be clipped to the midpoint
    expect(doWindow.maxFrequencyHz).toBeLessThanOrEqual(midpoint + 0.01);
    // re's min should be clipped to the midpoint
    expect(reWindow.minFrequencyHz).toBeGreaterThanOrEqual(midpoint - 0.01);
    // No overlap
    expect(doWindow.maxFrequencyHz).toBeLessThanOrEqual(reWindow.minFrequencyHz);
  });
});
