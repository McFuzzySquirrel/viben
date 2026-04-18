# Feature: Voice Calibration Mode

## 1. Feature Overview

**Feature Name:** Voice Calibration Mode  
**Parent Document:** [docs/PRD.md](../PRD.md)  
**Status:** Draft  
**Summary:** A pre-game calibration flow where the player sings and holds each solfege note (Do, Re, Mi, Fa, Sol, La, Ti) so the game captures their personal frequency ranges. During gameplay, the captured voice profile replaces the standard A4-derived note windows, adapting the game to the player's actual voice rather than expecting textbook musical pitch.  
**Scope:**  
- **Included:** Guided calibration UI, per-note frequency capture, voice profile persistence, integration with existing classification pipeline, profile management (save/load/delete/re-calibrate)  
- **Excluded:** Multi-octave calibration, real-time frequency shifting during gameplay, cloud sync of voice profiles, voice recognition or identification  
**Dependencies:** None — builds on the completed Phase 1–3 foundation  

---

## 2. Context: Existing System State

**Completed PRD Phases:** All 3 phases complete (17 tasks, 209 tests).  
**Relevant Existing Components:**  
- `src/shared/config/solfege.ts` — Note definitions, `buildSolfegeWindows()`, calibration presets, `SolfegeCalibrationConfig`  
- `src/features/audio/pitch/classification.ts` — `classifyPitchSample()` pipeline that matches frequency to note windows  
- `src/features/audio/pitch/usePitchMonitor.ts` — Hook that feeds pitch data from mic into classification  
- `src/features/audio/input/session.ts` — `AudioInputSession` for mic capture  
- `src/shared/config/difficulty.ts` — `getDifficultyCalibration()`, `buildDifficultySolfegeWindows()`  
- `src/shared/persistence/storage.ts` — Generic localStorage read/write  
- `src/shared/persistence/progression-storage.ts` — Progression persistence layer  
- `src/app/router/route-config.tsx` — Route definitions  
- `src/shared/types/routes.ts` — Route path constants  

**Existing Agents Involved:** `audio-systems-engineer`, `ui-hud-developer`, `progression-systems-engineer`, `qa-test-engineer`  
**Established Conventions:** TypeScript strict mode, Vitest testing, Vite builds, localStorage-only persistence, privacy-first (no raw audio stored), `prefers-reduced-motion` support, retro monospace HUD styling.

---

## 3. Feature Goals and Non-Goals

### 3.1 Goals
- Allow players to calibrate the game to their actual voice frequencies
- Dramatically improve accessibility for players whose voices don't match standard A4=440Hz tuning
- Persist voice profiles locally so players don't re-calibrate every session
- Integrate seamlessly with the existing difficulty system (voice profile + difficulty tolerance)
- Provide clear, guided UX for the calibration process
- Maintain privacy — store only frequency statistics, never raw audio

### 3.2 Non-Goals
- Does not change the core classification pipeline algorithm — only the frequency windows it operates on
- Does not replace standard calibration — voice profile is optional, standard mode remains default
- Does not add new solfege notes beyond the existing 7 (Do–Ti)
- Does not persist raw audio samples or waveforms
- Does not support multiple user profiles (single voice profile per browser)
- Does not modify the game engine, simulation, or scoring logic

---

## 4. User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| VC-US-01 | Beginner Singer | calibrate the game to my voice before playing | the note windows match my actual singing range | Must |
| VC-US-02 | Casual Challenger | skip calibration and play with standard settings | I can jump straight into the game if I want | Must |
| VC-US-03 | Returning Player | have my voice calibration saved between sessions | I don't need to re-calibrate every time | Must |
| VC-US-04 | Beginner Singer | see real-time feedback while calibrating each note | I know the game is hearing me correctly | Must |
| VC-US-05 | Casual Challenger | re-calibrate or clear my voice profile | I can start fresh if my calibration feels wrong | Should |
| VC-US-06 | Beginner Singer | see which notes I've calibrated and which remain | I can track my progress through calibration | Should |

---

## 5. Technical Approach

### 5.1 Impact on Existing Architecture

| Component | File(s) | Change |
|-----------|---------|--------|
| Solfege config | `src/shared/config/solfege.ts` | Add `VoiceProfile` type and `buildSolfegeWindowsFromVoiceProfile()` function that creates windows from captured frequencies instead of A4 math |
| Classification | `src/features/audio/pitch/classification.ts` | No change — already accepts any `SolfegeCalibrationConfig` and windows array |
| Difficulty config | `src/shared/config/difficulty.ts` | Add helper to merge voice profile with difficulty tolerance |
| Persistence | `src/shared/persistence/` | Add `voice-profile-storage.ts` for localStorage read/write of voice profiles |
| Route config | `src/shared/types/routes.ts`, `src/app/router/route-config.tsx` | Add `/calibration` route |
| Home screen | `src/screens/HomeScreen/HomeScreen.tsx` | Add "Calibrate Voice" button and voice profile status indicator |
| Game screen | `src/screens/GameScreen/GameScreen.tsx` | Pass voice profile (if exists) into pitch monitor calibration |

### 5.2 New Components

| Component | Proposed Path | Purpose |
|-----------|---------------|---------|
| Voice profile types | `src/features/calibration/types.ts` | `VoiceProfile`, `NoteCalibrationSample`, `CalibrationState` types |
| Calibration capture hook | `src/features/calibration/useCalibrationCapture.ts` | Hook that guides through note-by-note capture, collecting frequency samples |
| Voice profile builder | `src/features/calibration/voice-profile.ts` | Pure functions to aggregate samples into a voice profile and build custom windows |
| Voice profile storage | `src/shared/persistence/voice-profile-storage.ts` | localStorage persistence for voice profiles |
| Calibration screen | `src/screens/CalibrationScreen/CalibrationScreen.tsx` | Full-page guided calibration flow |
| Note capture card | `src/features/calibration/components/NoteCaptureCard.tsx` | UI for capturing a single note with live feedback |
| Calibration progress | `src/features/calibration/components/CalibrationProgress.tsx` | Visual progress through the 7 notes |
| Feature barrel | `src/features/calibration/index.ts` | Public exports |

### 5.3 Technology Additions

None — uses only existing technologies (React, Web Audio API, localStorage, Vitest).

---

## 6. Functional Requirements

| ID | Requirement | Affects Existing | Priority |
|----|-------------|-----------------|----------|
| VC-FR-01 | The calibration flow presents each solfege note (Do–Ti) one at a time, showing the note name and prompting the player to sing and hold it | No | Must |
| VC-FR-02 | While the player sings, the system captures frequency samples using the existing pitch detection pipeline and displays real-time feedback (detected frequency, signal strength) | No | Must |
| VC-FR-03 | Each note requires a minimum hold duration (e.g., 1.5 seconds of stable pitch) before the capture is accepted | No | Must |
| VC-FR-04 | After capturing all notes, the system builds a `VoiceProfile` containing the median frequency and frequency range for each note | No | Must |
| VC-FR-05 | The voice profile is persisted to localStorage under a dedicated key and survives page reloads | Yes (persistence layer) | Must |
| VC-FR-06 | When a voice profile exists, gameplay uses custom note windows derived from the profile's per-note frequencies instead of A4-derived windows | Yes (game screen calibration) | Must |
| VC-FR-07 | The difficulty system's cents tolerance is applied on top of voice profile windows (wider tolerance on Easy, tighter on Hard) | Yes (difficulty config) | Must |
| VC-FR-08 | Players can skip calibration entirely — standard A4-derived windows remain the default | No | Must |
| VC-FR-09 | Players can re-calibrate individual notes or perform a full re-calibration | No | Should |
| VC-FR-10 | Players can delete their voice profile from the Home screen to return to standard mode | Yes (Home screen) | Should |
| VC-FR-11 | The calibration screen is accessible via a dedicated route (`/calibration`) and from a button on the Home screen | Yes (routes, Home screen) | Must |
| VC-FR-12 | Calibration requires an active microphone session — reuse the existing mic permission and readiness flow | No | Must |
| VC-FR-13 | During capture, samples classified as 'silence', 'unusable', or 'out-of-range' are discarded — only 'note' classifications are counted toward the hold duration | No | Must |

---

## 7. Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| VC-NF-01 | Voice profile storage must not exceed 2 KB in localStorage (only statistical data, no raw samples) | Must |
| VC-NF-02 | Calibration capture must meet the same 150ms latency budget as gameplay (NF-01) | Must |
| VC-NF-03 | No raw audio, waveforms, or voiceprint data is stored — only per-note frequency statistics (median, min, max) | Must |
| VC-NF-04 | Calibration UI must respect `prefers-reduced-motion` and maintain accessible contrast ratios | Should |
| VC-NF-05 | The calibration flow should complete in under 2 minutes for all 7 notes | Should |

---

## 8. Agent Impact Assessment

### 8.1 Existing Agents — Extended Responsibilities

| Agent | New Responsibilities | Modified Boundaries |
|-------|---------------------|-------------------|
| `audio-systems-engineer` | Build calibration capture hook and voice profile builder; extend solfege config with voice-profile window builder | Now also owns `src/features/calibration/` for capture logic and voice profile types |
| `ui-hud-developer` | Build CalibrationScreen, NoteCaptureCard, and CalibrationProgress components; add calibration button to HomeScreen | Now also owns calibration screen and components |
| `progression-systems-engineer` | Build voice profile localStorage persistence; integrate profile status into home screen state | Now also owns `voice-profile-storage.ts` |
| `qa-test-engineer` | Write unit tests for voice profile builder, integration tests for calibration flow, regression tests for existing classification | Test coverage for all new calibration code |

### 8.2 New Agents Required

None — existing agents cover all required domains.

### 8.3 Existing Agents — No Changes

| Agent | Reason |
|-------|--------|
| `gameplay-systems-engineer` | Game engine, simulation, and scoring are unaffected — they consume calibration outputs already |
| `project-architect` | No architectural changes needed — new route and feature module follow established patterns |

---

## 9. Implementation Phases

### Phase F1: Voice Profile Types and Core Logic
- [ ] F1.1: Define `VoiceProfile`, `NoteCalibrationSample`, and `CalibrationState` types in `src/features/calibration/types.ts`
- [ ] F1.2: Implement `buildSolfegeWindowsFromVoiceProfile()` in `src/features/calibration/voice-profile.ts` — takes a voice profile and cents tolerance, returns `SolfegeWindow[]` using captured frequencies as centers
- [ ] F1.3: Implement `aggregateCalibrationSamples()` — takes raw frequency samples for a note and produces median/min/max statistics
- [ ] F1.4: Add `mergeVoiceProfileWithDifficulty()` helper in difficulty config — applies difficulty cents tolerance to voice profile windows
- [ ] F1.5: Implement voice profile persistence in `src/shared/persistence/voice-profile-storage.ts`
- [ ] F1.6: Unit tests for voice profile builder, sample aggregation, persistence, and difficulty merging

### Phase F2: Calibration Capture and Screen
- [ ] F2.1: Implement `useCalibrationCapture` hook — manages note-by-note capture flow using `usePitchMonitor`, tracks hold duration, collects samples
- [ ] F2.2: Build `NoteCaptureCard` component — displays current target note, live frequency feedback, hold progress bar
- [ ] F2.3: Build `CalibrationProgress` component — shows which notes are complete/pending
- [ ] F2.4: Build `CalibrationScreen` — full guided flow with mic permission, note capture sequence, completion summary
- [ ] F2.5: Add `/calibration` route and navigation from Home screen
- [ ] F2.6: Tests for calibration capture hook, screen rendering, and route integration

### Phase F3: Game Integration and Polish
- [ ] F3.1: Integrate voice profile into game screen — when profile exists, build custom windows and pass to pitch monitor
- [ ] F3.2: Add voice profile status indicator and management controls to Home screen (calibrated badge, re-calibrate, delete)
- [ ] F3.3: Add ability to re-calibrate individual notes from the calibration screen
- [ ] F3.4: Regression tests — verify existing gameplay, classification, and persistence still work with and without voice profile
- [ ] F3.5: Full integration test — calibrate → play game with profile → verify custom windows are used

---

## 10. Testing Strategy

| Level | Scope | Approach |
|-------|-------|----------|
| Unit Tests | Voice profile builder, sample aggregation, persistence, difficulty merge | Pure function tests with known frequency inputs |
| Unit Tests | Calibration capture hook | Mock pitch monitor, verify state transitions and sample collection |
| Integration Tests | Calibration screen flow | Render screen, simulate mic input, verify profile creation |
| Integration Tests | Game with voice profile | Verify custom windows are passed through to classification |
| Regression Tests | Existing classification pipeline | Verify no behavioral changes when no voice profile is present |
| Regression Tests | Existing persistence | Verify progression data is unaffected by voice profile storage |

**Key test scenarios:**
1. Building windows from a voice profile produces correct center frequencies and ranges
2. Sample aggregation computes correct median from multiple frequency readings
3. Voice profile persists to and loads from localStorage correctly
4. Difficulty tolerance is correctly applied on top of voice profile windows
5. Calibration flow rejects silence/unusable samples and only accepts stable pitch
6. Game uses standard windows when no voice profile exists (regression)
7. Game uses custom windows when voice profile is loaded
8. Deleting voice profile reverts to standard windows

---

## 11. Rollback Considerations

- **Modified existing files:** `solfege.ts` (additive — new function), `difficulty.ts` (additive — new helper), `routes.ts` (additive — new path), `route-config.tsx` (additive — new route), `HomeScreen.tsx` (additive — new button), `GameScreen.tsx` (conditional — voice profile check)
- **New files:** Everything in `src/features/calibration/`, `src/shared/persistence/voice-profile-storage.ts`, `src/screens/CalibrationScreen/`
- **Rollback approach:** All changes are additive or gated behind voice profile existence checks. Removing the new files and reverting the small additions to existing files restores original behavior. No data migrations needed — voice profile uses a separate localStorage key.
- **Data cleanup:** Deleting the `viben:voice-profile` localStorage key removes all calibration data.

---

## 12. Acceptance Criteria

1. Player can complete a guided calibration flow, singing each of the 7 solfege notes
2. Each note capture requires stable pitch held for a minimum duration
3. Voice profile is saved to localStorage and survives page reload
4. Gameplay uses custom voice-profile-derived note windows when a profile exists
5. Gameplay uses standard A4-derived windows when no profile exists (no regression)
6. Difficulty tolerance (Easy/Normal/Hard) applies correctly on top of voice profile windows
7. Player can re-calibrate or delete their voice profile
8. Calibration screen is accessible via `/calibration` route and from Home screen
9. No raw audio is stored — only frequency statistics
10. All existing tests continue to pass

---

## 13. Open Questions

| # | Question | Default Assumption |
|---|----------|--------------------|
| 1 | Should we support multiple voice profiles (e.g., for different family members)? | No — single profile per browser. Can add multi-profile later. |
| 2 | What is the minimum hold duration for accepting a note capture? | 1.5 seconds of stable pitch (within ±30 cents of the running median) |
| 3 | Should calibration be recommended on first launch? | No — optional, accessible from Home screen. May add a suggestion tooltip later. |
| 4 | Should we play a reference tone for each note during calibration? | No for v1 — the player sings their natural pitch. Reference tones could bias toward standard tuning, defeating the purpose. |
