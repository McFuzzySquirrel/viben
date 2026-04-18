# Solfege Frequency Design

How Vib'N maps singing to gameplay — from music theory to the frequency
windows the pitch engine uses at runtime.

---

## 1. Background: Equal Temperament and A4 = 440 Hz

Western music divides the octave into **12 equally spaced semitones**.
Every semitone is a constant frequency ratio of 2^(1/12) ≈ 1.05946.
The international standard reference pitch is **A4 = 440 Hz**, which
anchors every other note:

```
frequency(note) = 440 × 2^(semitoneOffset / 12)
```

Vib'N uses the **solfege syllable** system (Do Re Mi Fa Sol La Ti)
mapped to the **C-major scale in octave 4** (C4 through B4):

| Solfege | Scientific | Semitone offset from A4 | Frequency (Hz) |
|---------|-----------|------------------------|-----------------|
| Do      | C4        | −9                     | ≈ 261.6         |
| Re      | D4        | −7                     | ≈ 293.7         |
| Mi      | E4        | −5                     | ≈ 329.6         |
| Fa      | F4        | −4                     | ≈ 349.2         |
| Sol     | G4        | −2                     | ≈ 392.0         |
| La      | A4        |  0                     | = 440.0         |
| Ti      | B4        | +2                     | ≈ 493.9         |

These definitions live in `src/shared/config/solfege.ts →
SOLFEGE_NOTE_DEFINITIONS`.

---

## 2. Note Windows: Cents Tolerance

A "note window" is the frequency band around a note's center that
the engine considers a match.  Window width is expressed in **cents** —
a logarithmic unit where 100 cents = 1 semitone.  The min/max bounds
are computed symmetrically:

```
min = center × 2^(−cents / 1200)
max = center × 2^(+cents / 1200)
```

For example, with a 45-cent tolerance around Do (261.6 Hz):

```
min = 261.6 × 2^(−45/1200) ≈ 254.8 Hz
max = 261.6 × 2^(+45/1200) ≈ 268.5 Hz
```

This is implemented by `buildSolfegeWindows()` in `solfege.ts` and
`toFrequencyOffset()` for the exponential calculation.

---

## 3. Difficulty-Driven Window Widths

Each difficulty level defines its own `noteWindowCentsTolerance`,
creating wider or narrower acceptance bands:

| Difficulty | Cents tolerance | Window feel                  |
|------------|-----------------|------------------------------|
| **Easy**   | ±65 cents       | Very forgiving — almost a full semitone each side |
| **Normal** | ±45 cents       | Balanced — the default baseline |
| **Hard**   | ±35 cents       | Tight — requires accurate pitch |

These values are defined in `src/shared/config/difficulty.ts →
DIFFICULTY_DEFINITION_MAP`.  The function `getDifficultyCalibration()`
merges the difficulty's tolerance with the base calibration config,
and `buildDifficultySolfegeWindows()` returns the final set of 7
`SolfegeWindow` objects.

### Why these specific values?

- **65 cents (Easy)** — Originally 45 cents, widened after player
  testing revealed that untrained voices drift ±50 cents routinely.
  65 cents gives approximately one full semitone of total width
  (130 cents), enough for most casual singers to register hits.

- **45 cents (Normal)** — The project baseline.  90 cents of total
  window width keeps adjacent notes (minimum 100 cents apart)
  non-overlapping while allowing natural vibrato (typically ±20–30
  cents).

- **35 cents (Hard)** — Requires deliberate pitch control.  70 cents
  of total width still accommodates moderate vibrato but penalises
  sloppy intonation.

---

## 4. Global Frequency Bounds

Independent of note windows, the classifier enforces a global
frequency range to reject non-vocal noise:

| Parameter          | Value    | Rationale                              |
|--------------------|----------|----------------------------------------|
| `minimumFrequencyHz` | 80 Hz  | Below the lowest typical male bass voice (~85 Hz) but above 50/60 Hz mains hum |
| `maximumFrequencyHz` | 1100 Hz | Well above the soprano high C6 (≈1047 Hz) and child voices |

Signals outside this band are classified `out-of-range` regardless of
whether they fall inside a note window.  Originally 220–523 Hz (only
octave 4), the range was expanded to 80–1100 Hz to accommodate deeper
and higher voices.

The silence threshold (`minimumSignalRms = 0.025`, ≈ −32 dBFS) rejects
ambient room noise before any frequency analysis occurs.  This was
raised from 0.012 after testing showed that typical laptop fan noise
and air conditioning registered above the original threshold.

These values live in `DEFAULT_SOLFEGE_CALIBRATION` in `solfege.ts`.

---

## 5. Calibration Presets

Three presets provide quick-select tuning profiles:

| Preset      | Cents | A4 ref  | Use case                         |
|-------------|-------|---------|----------------------------------|
| **Default** | 45    | 440 Hz  | Standard balanced play           |
| **Sensitive** | 75  | 440 Hz  | Beginners or noisy environments  |
| **Strict**  | 25    | 440 Hz  | Precision practice for trained singers |

Presets act as overlays on top of difficulty-driven calibration.  They
are defined in `CALIBRATION_PRESETS` in `solfege.ts`.

---

## 6. The Problem: Why Standard Windows Aren't Enough

The standard system assumes every singer's "Do" is near 261.6 Hz.  In
practice this is often false:

- **Untrained singers** may not know which octave to target.  A male
  baritone's comfortable "Do" might be C3 (≈130.8 Hz), far below the
  C4-based windows.
- **Non-standard vocal ranges** — children sing higher, bass voices
  lower.  No single reference octave fits everyone.
- **Pitch drift** — some singers consistently sing sharp or flat by
  more than a semitone, placing every note outside even the widest
  preset window.

During testing, the calibration screen showed "classification:
out-of-range" because the user's frequencies didn't fall inside any of
the 7 predefined windows — even though they were singing real,
consistent notes.  The standard system was rejecting valid input.

---

## 7. Voice Calibration: Custom Frequency Windows

To solve this, we added a **Voice Calibration** mode where the player
sings each solfege note in turn, and the system captures their actual
frequencies rather than assuming equal-temperament A4 tuning.

### 7.1 How Calibration Works

1. The player opens the Calibration screen (`/calibration`).
2. For each of the 7 solfege notes (Do through Ti):
   - The player presses **Start Capture** and sings their version of
     the note.
   - The pitch monitor detects the raw frequency at ~80 ms intervals.
   - **Any detected frequency is accepted** — the calibration hook
     does not filter by predefined note windows.  This is the key
     difference from gameplay mode.
   - After ~1.5 seconds of steady singing (19 samples at 80 ms), the
     hold bar fills and the player confirms.
3. For each captured note, `aggregateCalibrationSamples()` computes:
   - **Median frequency** — becomes the center of the custom window
   - **Min / max frequency** — recorded for reference
   - **Sample count** — at least 5 valid samples required
4. The resulting `VoiceProfile` is saved to `localStorage` (key:
   `viben:voice-profile`, version 1).  Only frequency statistics are
   stored — no raw audio (privacy).

### 7.2 How Custom Windows Are Built

`buildSolfegeWindowsFromVoiceProfile(profile, centsTolerance)` replaces
the standard `buildSolfegeWindows()` pipeline:

| Standard windows                        | Custom windows                           |
|----------------------------------------|------------------------------------------|
| Center = `440 × 2^(semitone/12)`       | Center = player's **median captured Hz** |
| Same formula for min/max using cents    | Same formula for min/max using cents     |
| 7 fixed frequencies for all players     | 7 personalised frequencies per player    |

The **cents tolerance still comes from difficulty** — Easy at ±65,
Normal at ±45, Hard at ±35.  Only the center frequency changes.

#### Expanded Windows: Honouring the Full Captured Range

The tolerance-derived bounds (`median ± cents`) may be narrower than
the player's actual vocal range for a note.  To prevent rejecting
frequencies the player just demonstrated they can sing, custom windows
are **expanded** to encompass the full captured range:

```
toleranceMin = median × 2^(−cents / 1200)
toleranceMax = median × 2^(+cents / 1200)

windowMin = min(toleranceMin, capturedMinFrequencyHz)
windowMax = max(toleranceMax, capturedMaxFrequencyHz)
```

This means the window is always **at least as wide** as the player's
observed range during calibration.

#### Overlap Prevention: Geometric Midpoint Clipping

Expanding windows could cause adjacent notes to overlap.  To prevent
this, each window is clipped so its bounds never extend past the
**geometric midpoint** to its neighbours:

```
midpoint(noteA, noteB) = √(centerA × centerB)
```

The geometric mean is used instead of arithmetic because frequency
perception is logarithmic — equal distances in cents correspond to
equal ratios, not equal Hz differences.

Example: a player whose "Do" median is 185 Hz on Easy difficulty:

```
center     = 185.0 Hz  (captured, not computed)
tolerance  = ±65 cents
tolerMin   = 185.0 × 2^(−65/1200) ≈ 178.2 Hz
tolerMax   = 185.0 × 2^(+65/1200) ≈ 192.1 Hz
capturedMin = 175.0 Hz  (their lowest sample)
capturedMax = 195.0 Hz  (their highest sample)

windowMin  = min(178.2, 175.0) = 175.0 Hz  ← expanded to captured
windowMax  = max(192.1, 195.0) = 195.0 Hz  ← expanded to captured
(then clipped to geometric midpoints with Re, if needed)
```

Compare with standard: center = 261.6 Hz, min ≈ 252 Hz, max ≈ 272 Hz.
The player's actual "Do" (185 Hz) would be classified `out-of-range`
with standard windows — but hits perfectly with custom windows.

### 7.3 Nearest-Window Classifier

When windows could overlap (especially with expanded voice-profile
windows or wide Easy-mode tolerance), the classifier uses a
**nearest-window-by-center** strategy instead of matching the first
window whose bounds contain the frequency:

1. Find the window whose **center frequency** is closest to the
   detected pitch (using the existing `findNearestWindow()` helper).
2. Check whether the pitch falls within that window's min/max bounds.
3. If yes → classification is `'note'` with that window's `noteId`.
4. If no → classification is `'out-of-range'`.

This eliminates order-dependent ambiguity: if a frequency happens to
fall inside two overlapping windows, it is always assigned to the note
whose center is closer — which is the musically correct choice.

### 7.4 Integration Into Gameplay

When the game starts, `useGameRunController` checks for a saved voice
profile:

```
const { profile } = loadVoiceProfile();
if (profile) {
  customWindows = buildVoiceProfileDifficultyWindows(profile, difficultyId);
}
```

The `customWindows` array is threaded through the full audio pipeline:

```
useGameRunController
  → useGameplayAudioInput(targetNote, calibration, customWindows)
    → usePitchMonitor(session, calibration, monitorConfig, customWindows)
      → classifyPitchSample(freq, stats, calibration, customWindows)
    → selectPitchTargetSnapshot(sample, targetNote, calibration, customWindows)
```

In `classifyPitchSample`, when `customWindows` is provided, the engine
skips `buildSolfegeWindows(calibration)` and uses the custom array
directly.  Everything else — silence detection, RMS thresholds,
confidence scoring — stays the same.

`selectPitchTargetSnapshot` also receives `customWindows` so that the
`centsOffTarget` value (used for UI feedback) is calculated against the
player's actual center frequency, not the standard A4-derived one.

### 7.5 Dual-Mode Design: Standard and Custom Coexist

The voice calibration system is **purely opt-in** and the standard
solfege experience is fully preserved:

| Scenario | Windows used | How it works |
|----------|-------------|--------------|
| **No voice profile saved** (default) | Standard A4-based | `customWindows` is `undefined`; classifier falls through to `buildSolfegeWindows(calibration)` |
| **Voice profile saved** | Player's captured frequencies | `customWindows` are built from profile; classifier uses them directly |
| **Profile deleted** | Standard A4-based | Deleting the profile returns the player to the standard path |

Players who want the "official" equal-temperament experience never need
to calibrate — the standard path has **zero code changes** and remains
the default.  Players who struggle to hit standard pitch windows can
calibrate and get personalised windows that match their actual voice.

Both paths produce the same data structure (`SolfegeWindow[7]`), so the
rest of the engine — gameplay scoring, prompt matching, stability
tracking — is completely mode-agnostic.

### 7.6 Calibration Capture: Why All Frequencies Are Accepted

During calibration (but NOT during gameplay), the capture hook accepts
any sample where `frequencyHz !== null`.  This is intentional:

- **Gameplay mode** — frequency must fall inside a note window
  (standard or custom) to be classified as `'note'`
- **Calibration mode** — frequency is recorded regardless of window
  matching, because the whole purpose is discovering where the
  player's notes actually are

The global bounds (80–1100 Hz) and silence threshold still apply during
calibration, filtering out noise and non-vocal sounds.

---

## 8. Architecture Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        Game Start                                │
│                                                                  │
│  Voice profile saved?                                            │
│  ├─ No  → buildSolfegeWindows(difficultyCalibration)             │
│  │        Uses A4=440 Hz + semitone offsets + difficulty cents    │
│  │                                                               │
│  └─ Yes → buildSolfegeWindowsFromVoiceProfile(profile, cents)    │
│           Uses player's captured median Hz + difficulty cents     │
│                                                                  │
│  Either path produces: SolfegeWindow[7]                          │
│    { id, centerFrequencyHz, minFrequencyHz, maxFrequencyHz }     │
│                                                                  │
│  ↓                                                               │
│  classifyPitchSample(freq, stats, calibration, windows?)         │
│    → Uses nearest-window-by-center matching                      │
│    → 'silence' | 'unusable' | 'out-of-range' | 'note'           │
│    → noteId, confidence, centsFromNearest                        │
│                                                                  │
│  selectPitchTargetSnapshot(sample, target, cal, windows?)        │
│    → centsOffTarget calculated against correct window centers    │
│                                                                  │
│  ↓                                                               │
│  Gameplay engine: stability, altitude, score                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Key Source Files

| File | Purpose |
|------|---------|
| `src/shared/config/solfege.ts` | Note definitions, calibration config, `buildSolfegeWindows()`, presets |
| `src/shared/config/difficulty.ts` | Difficulty tuning including cents tolerance, `buildVoiceProfileDifficultyWindows()` |
| `src/features/audio/pitch/classification.ts` | `classifyPitchSample()` — nearest-window-by-center frequency→note classifier |
| `src/features/audio/pitch/selectors.ts` | `selectPitchTargetSnapshot()` — computes `centsOffTarget` using custom windows when available |
| `src/features/calibration/voice-profile.ts` | `aggregateCalibrationSamples()`, `buildSolfegeWindowsFromVoiceProfile()` |
| `src/features/calibration/useCalibrationCapture.ts` | Hook managing the note-by-note capture flow |
| `src/features/calibration/types.ts` | `VoiceProfile`, `NoteCalibrationData` types |
| `src/shared/persistence/voice-profile-storage.ts` | localStorage read/write for voice profiles |
| `src/features/game/state/useGameRunController.ts` | Loads profile and threads custom windows into gameplay |
| `src/features/game/engine/tuning.ts` | Difficulty-specific gameplay rates and event catalogs |
