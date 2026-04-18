import type { SolfegeNoteId } from '@shared/config/solfege';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';
import { readJsonFromStorage, writeJsonToStorage, type StorageIssueCode } from './storage';
import type { NoteCalibrationData, VoiceProfile } from '@features/calibration/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VOICE_PROFILE_STORAGE_KEY = 'viben:voice-profile';
export const VOICE_PROFILE_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isSolfegeNoteId(value: unknown): value is SolfegeNoteId {
  return typeof value === 'string' && SOLFEGE_NOTE_IDS.includes(value as SolfegeNoteId);
}

function coerceNoteCalibrationData(value: unknown): NoteCalibrationData | null {
  if (!isObject(value)) {
    return null;
  }

  if (!isSolfegeNoteId(value.noteId)) {
    return null;
  }

  if (
    !isPositiveFiniteNumber(value.medianFrequencyHz) ||
    !isPositiveFiniteNumber(value.minFrequencyHz) ||
    !isPositiveFiniteNumber(value.maxFrequencyHz)
  ) {
    return null;
  }

  if (!isNonNegativeInteger(value.sampleCount)) {
    return null;
  }

  if (!isIsoTimestamp(value.capturedAt)) {
    return null;
  }

  return {
    noteId: value.noteId,
    medianFrequencyHz: value.medianFrequencyHz,
    minFrequencyHz: value.minFrequencyHz,
    maxFrequencyHz: value.maxFrequencyHz,
    sampleCount: value.sampleCount,
    capturedAt: value.capturedAt,
  };
}

function coerceVoiceProfile(candidate: unknown): VoiceProfile | null {
  if (!isObject(candidate)) {
    return null;
  }

  if (candidate.version !== VOICE_PROFILE_VERSION) {
    return null;
  }

  if (!isIsoTimestamp(candidate.createdAt) || !isIsoTimestamp(candidate.updatedAt)) {
    return null;
  }

  if (!isObject(candidate.notes)) {
    return null;
  }

  const notes: Partial<Record<SolfegeNoteId, NoteCalibrationData>> = {};

  for (const noteId of SOLFEGE_NOTE_IDS) {
    const noteData = coerceNoteCalibrationData(candidate.notes[noteId]);

    if (!noteData || noteData.noteId !== noteId) {
      return null;
    }

    notes[noteId] = noteData;
  }

  return {
    version: VOICE_PROFILE_VERSION,
    notes: notes as Record<SolfegeNoteId, NoteCalibrationData>,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface VoiceProfileLoadResult {
  profile: VoiceProfile | null;
  issue: StorageIssueCode | null;
}

/**
 * Load a previously saved voice profile from storage.
 *
 * Returns `{ profile: null, issue: null }` when no profile has been saved.
 * Returns `{ profile: null, issue }` when storage is unavailable or the
 * stored data is corrupt / version-mismatched.
 */
export function loadVoiceProfile(storage?: Storage | null): VoiceProfileLoadResult {
  const readResult = readJsonFromStorage(VOICE_PROFILE_STORAGE_KEY, storage);

  if (readResult.issue) {
    return { profile: null, issue: readResult.issue };
  }

  if (!readResult.hasStoredValue) {
    return { profile: null, issue: null };
  }

  const profile = coerceVoiceProfile(readResult.value);

  if (!profile) {
    return { profile: null, issue: 'invalid-json' };
  }

  return { profile, issue: null };
}

/**
 * Persist a voice profile to storage.
 *
 * Returns `null` on success, or a `StorageIssueCode` describing the failure.
 */
export function saveVoiceProfile(
  profile: VoiceProfile,
  storage?: Storage | null,
): StorageIssueCode | null {
  return writeJsonToStorage(VOICE_PROFILE_STORAGE_KEY, profile, storage);
}

/**
 * Remove a stored voice profile.
 *
 * Returns `null` on success, or `'storage-unavailable'` when storage cannot
 * be resolved.
 */
export function deleteVoiceProfile(storage?: Storage | null): StorageIssueCode | null {
  // Use writeJsonToStorage with a null-like approach isn't ideal;
  // directly removing the key is cleaner.  However, the storage helpers
  // don't expose a "remove" function, so we resolve storage manually.
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return 'storage-unavailable';
  }

  try {
    resolvedStorage.removeItem(VOICE_PROFILE_STORAGE_KEY);
    return null;
  } catch {
    return 'write-failed';
  }
}

// ---------------------------------------------------------------------------
// Internal — storage resolution (mirrors storage.ts logic)
// ---------------------------------------------------------------------------

function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
