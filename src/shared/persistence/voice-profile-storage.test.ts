// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SOLFEGE_NOTE_IDS } from '@shared/config/solfege';
import type { NoteCalibrationData, VoiceProfile } from '@features/calibration/types';
import {
  deleteVoiceProfile,
  loadVoiceProfile,
  saveVoiceProfile,
  VOICE_PROFILE_STORAGE_KEY,
  VOICE_PROFILE_VERSION,
} from './voice-profile-storage';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestVoiceProfile(): VoiceProfile {
  const notes = Object.fromEntries(
    SOLFEGE_NOTE_IDS.map((id, i) => [
      id,
      {
        noteId: id,
        medianFrequencyHz: 250 + i * 30,
        minFrequencyHz: 240 + i * 30,
        maxFrequencyHz: 260 + i * 30,
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
// loadVoiceProfile
// ---------------------------------------------------------------------------

describe('loadVoiceProfile', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns { profile: null, issue: null } when nothing is stored', () => {
    const result = loadVoiceProfile(window.localStorage);
    expect(result.profile).toBeNull();
    expect(result.issue).toBeNull();
  });

  it('returns valid profile when valid data is stored', () => {
    const profile = createTestVoiceProfile();
    window.localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    const result = loadVoiceProfile(window.localStorage);

    expect(result.profile).not.toBeNull();
    expect(result.issue).toBeNull();
    expect(result.profile!.version).toBe(VOICE_PROFILE_VERSION);
    expect(result.profile!.notes.do.noteId).toBe('do');
  });

  it("returns { profile: null, issue: 'invalid-json' } for corrupt data", () => {
    window.localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, '{not valid json');

    const result = loadVoiceProfile(window.localStorage);

    expect(result.profile).toBeNull();
    expect(result.issue).toBe('invalid-json');
  });

  it("returns { profile: null, issue: 'invalid-json' } for wrong version", () => {
    const badProfile = { ...createTestVoiceProfile(), version: 999 };
    window.localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, JSON.stringify(badProfile));

    const result = loadVoiceProfile(window.localStorage);

    expect(result.profile).toBeNull();
    expect(result.issue).toBe('invalid-json');
  });

  it("returns { profile: null, issue: 'invalid-json' } for missing notes", () => {
    const { notes: _notes, ...profileWithoutNotes } = createTestVoiceProfile();
    window.localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, JSON.stringify(profileWithoutNotes));

    const result = loadVoiceProfile(window.localStorage);

    expect(result.profile).toBeNull();
    expect(result.issue).toBe('invalid-json');
  });

  it("returns { profile: null, issue: 'storage-unavailable' } for null storage", () => {
    // Stub localStorage to throw so resolveStorage returns null
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('localStorage is not available');
      },
      configurable: true,
    });

    const result = loadVoiceProfile(null);

    expect(result.profile).toBeNull();
    expect(result.issue).toBe('storage-unavailable');
  });
});

// ---------------------------------------------------------------------------
// saveVoiceProfile
// ---------------------------------------------------------------------------

describe('saveVoiceProfile', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores profile that can be loaded back', () => {
    const profile = createTestVoiceProfile();
    const saveResult = saveVoiceProfile(profile, window.localStorage);

    expect(saveResult).toBeNull();

    const loadResult = loadVoiceProfile(window.localStorage);
    expect(loadResult.profile).not.toBeNull();
    expect(loadResult.issue).toBeNull();
    expect(loadResult.profile!.notes.do.medianFrequencyHz).toBe(profile.notes.do.medianFrequencyHz);
    expect(loadResult.profile!.createdAt).toBe(profile.createdAt);
  });

  it('returns null on success', () => {
    const profile = createTestVoiceProfile();
    const result = saveVoiceProfile(profile, window.localStorage);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// deleteVoiceProfile
// ---------------------------------------------------------------------------

describe('deleteVoiceProfile', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('removes a stored profile', () => {
    const profile = createTestVoiceProfile();
    saveVoiceProfile(profile, window.localStorage);

    // Verify it was stored
    expect(loadVoiceProfile(window.localStorage).profile).not.toBeNull();

    const deleteResult = deleteVoiceProfile(window.localStorage);
    expect(deleteResult).toBeNull();

    // Verify it was removed
    const loadResult = loadVoiceProfile(window.localStorage);
    expect(loadResult.profile).toBeNull();
    expect(loadResult.issue).toBeNull();
  });

  it('returns null on success', () => {
    const result = deleteVoiceProfile(window.localStorage);
    expect(result).toBeNull();
  });
});
