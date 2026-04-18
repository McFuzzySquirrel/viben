import type { SolfegeNoteId, SolfegeWindow } from '@shared/config/solfege';
import { SOLFEGE_NOTE_DEFINITIONS, SOLFEGE_NOTE_IDS, toFrequencyOffset } from '@shared/config/solfege';
import type { NoteCalibrationData, VoiceProfile } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum number of frequency samples required to produce a valid calibration. */
export const MIN_CALIBRATION_SAMPLES = 5 as const;

// ---------------------------------------------------------------------------
// Median Computation
// ---------------------------------------------------------------------------

/**
 * Compute the median of a **pre-sorted** numeric array.
 *
 * Returns the middle element for odd-length arrays, or the average of the
 * two middle elements for even-length arrays.
 *
 * @throws {Error} if the array is empty.
 */
export function computeMedian(sorted: ReadonlyArray<number>): number {
  if (sorted.length === 0) {
    throw new Error('Cannot compute median of an empty array.');
  }

  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ---------------------------------------------------------------------------
// Sample Aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate raw frequency samples captured during calibration into a
 * `NoteCalibrationData` record.
 *
 * Returns `null` when fewer than {@link MIN_CALIBRATION_SAMPLES} valid
 * samples are provided — the note cannot be reliably calibrated.
 *
 * Only stores statistical aggregates (median, min, max) — no raw audio or
 * individual frequency values are retained (SP-02, SP-06).
 */
export function aggregateCalibrationSamples(
  noteId: SolfegeNoteId,
  samples: ReadonlyArray<number>,
): NoteCalibrationData | null {
  if (samples.length < MIN_CALIBRATION_SAMPLES) {
    return null;
  }

  const sorted = [...samples].sort((a, b) => a - b);

  return {
    noteId,
    medianFrequencyHz: computeMedian(sorted),
    minFrequencyHz: sorted[0],
    maxFrequencyHz: sorted[sorted.length - 1],
    sampleCount: sorted.length,
    capturedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Voice-Profile → SolfegeWindow Mapping
// ---------------------------------------------------------------------------

/**
 * Build `SolfegeWindow[]` from a {@link VoiceProfile}'s captured frequencies.
 *
 * Instead of deriving center frequencies from an A4 reference via
 * equal-temperament math, each note's **median captured frequency** becomes
 * its center.  The cents tolerance is applied symmetrically to compute
 * the min/max frequency bounds, using the same formula as
 * `buildSolfegeWindows()` in `solfege.ts`:
 *
 * ```
 * min = center × 2^(−cents / 1200)
 * max = center × 2^(+cents / 1200)
 * ```
 *
 * The note metadata (`label`, `scientificPitch`, `semitoneOffsetFromA4`) is
 * preserved from the canonical note definitions.
 */
export function buildSolfegeWindowsFromVoiceProfile(
  profile: VoiceProfile,
  centsTolerance: number,
): ReadonlyArray<SolfegeWindow> {
  // Build raw windows: expand tolerance bounds to include the player's
  // actual captured min/max so their full vocal range is always accepted.
  const rawWindows = SOLFEGE_NOTE_IDS.map((noteId) => {
    const definition = SOLFEGE_NOTE_DEFINITIONS.find((d) => d.id === noteId)!;
    const calibrationData = profile.notes[noteId];
    const centerFrequencyHz = calibrationData.medianFrequencyHz;
    const toleranceMin = toFrequencyOffset(centerFrequencyHz, -centsTolerance);
    const toleranceMax = toFrequencyOffset(centerFrequencyHz, centsTolerance);

    return {
      ...definition,
      centerFrequencyHz,
      minFrequencyHz: Math.min(toleranceMin, calibrationData.minFrequencyHz),
      maxFrequencyHz: Math.max(toleranceMax, calibrationData.maxFrequencyHz),
    };
  });

  // Clip each window so it doesn't extend past the geometric midpoint to
  // its neighbours.  This prevents ambiguous overlap while still honouring
  // the player's captured range as much as possible.
  return rawWindows.map((window, i) => {
    let { minFrequencyHz, maxFrequencyHz } = window;

    if (i > 0) {
      const prevCenter = rawWindows[i - 1].centerFrequencyHz;
      const midpoint = Math.sqrt(prevCenter * window.centerFrequencyHz);
      minFrequencyHz = Math.max(minFrequencyHz, midpoint);
    }

    if (i < rawWindows.length - 1) {
      const nextCenter = rawWindows[i + 1].centerFrequencyHz;
      const midpoint = Math.sqrt(window.centerFrequencyHz * nextCenter);
      maxFrequencyHz = Math.min(maxFrequencyHz, midpoint);
    }

    return { ...window, minFrequencyHz, maxFrequencyHz };
  });
}
