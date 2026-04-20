# Project Progress

## Current State
**Mode**: Feature Increment — Mobile Support & UI Refresh  
**Feature PRD**: `docs/features/mobile-and-ui-refresh.md`  
**Original PRD**: `docs/PRD.md` (all 3 phases complete)  
**Phase**: All feature phases complete  
**Status**: ✅ Complete  
**Last Updated**: 2026-04-19

## Completed Tasks
- [x] Execution planning completed (@project-orchestrator)
  - Files: `docs/PROGRESS.md`
- [x] Phase 1, Task 1.1: Foundation migration and app shell setup (@project-architect)
  - Files: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/App.tsx`, `src/app/**`, `src/screens/**`, `src/shared/types/**`, `src/shared/config/privacy.ts`, `src/styles/global.css`, `src/components/VoiceInput.tsx`
- [x] Phase 1, Task 1.2: Extract microphone and pitch-detection pipeline (@audio-systems-engineer)
  - Files: `src/shared/config/solfege.ts`, `src/features/audio/**`, `src/screens/GameScreen/GameScreen.tsx`
- [x] Phase 1, Task 1.3: Define difficulty and persistence contracts (@progression-systems-engineer)
  - Files: `src/shared/config/difficulty.ts`, `src/features/progression/**`, `src/features/settings/**`, `src/shared/persistence/**`, `src/shared/types/app-shell.ts`, `src/app/providers/AppProviders.tsx`
- [x] Phase 1, Task 1.4: Define game-state primitives and integration contracts (@gameplay-systems-engineer)
  - Files: `src/features/game/**`
- [x] Phase 1, Task 1.5: Establish routed screen placeholders and baseline screen composition (@ui-hud-developer)
  - Files: `src/screens/HomeScreen/HomeScreen.tsx`, `src/screens/GameScreen/GameScreen.tsx`, `src/screens/ResultsScreen/ResultsScreen.tsx`, `src/screens/ProgressScreen/ProgressScreen.tsx`, `src/features/game/components/**`, `src/styles/global.css`
- [x] Phase 1, Task 1.6: Establish test harness and mocks (@qa-test-engineer)
  - Files: `vite.config.ts`, `src/test/**`, `src/app/AppShell.test.tsx`, `src/features/audio/input/useMicrophoneInput.test.tsx`, `src/shared/persistence/progression-storage.test.ts`
- [x] Phase 2, Task 2.1: Implement microphone readiness and live pitch integration (@audio-systems-engineer)
  - Files: `src/app/providers/AppProviders.tsx`, `src/features/audio/**`, `src/screens/HomeScreen/HomeScreen.tsx`, `src/screens/GameScreen/GameScreen.tsx`, `src/app/AppShell.test.tsx`
- [x] Phase 2, Task 2.2: Implement playable run loop (@gameplay-systems-engineer)
  - Files: `src/features/game/**`, `src/screens/GameScreen/GameScreen.tsx`, `src/screens/ResultsScreen/ResultsScreen.tsx`
- [x] Phase 2, Task 2.3: Build Home/Game screens and HUD (@ui-hud-developer)
  - Files: `src/screens/HomeScreen/HomeScreen.tsx`, `src/screens/GameScreen/GameScreen.tsx`, `src/features/game/components/**`, `src/styles/global.css`, `src/app/AppShell.test.tsx`, `src/screens/HomeScreen/HomeScreen.test.tsx`, `src/screens/GameScreen/GameScreen.test.tsx`
- [x] Phase 2, Task 2.4: Build results and save flow (@progression-systems-engineer)
  - Files: `src/features/progression/**`, `src/shared/persistence/**`, `src/screens/ResultsScreen/ResultsScreen.tsx`, `src/screens/ProgressScreen/ProgressScreen.tsx`, `src/features/game/state/**`, `src/app/AppShell.test.tsx`, `src/screens/ResultsScreen/ResultsScreen.test.tsx`, `src/screens/ProgressScreen/ProgressScreen.test.tsx`
- [x] Phase 2, Task 2.5: Add integration and acceptance coverage (@qa-test-engineer)
  - Files: `src/app/AppShell.phase2.test.tsx`, `src/screens/ResultsScreen/ResultsScreen.test.tsx`, `src/screens/ProgressScreen/ProgressScreen.test.tsx`

- [x] Phase 3, Task 3.1: Implement difficulty progression and comparison (@progression-systems-engineer)
  - Files: `src/features/progression/milestones.ts`, `src/features/progression/milestones.test.ts`, `src/features/progression/selectors.ts`, `src/features/progression/selectors.test.ts`, `src/features/progression/index.ts`, `src/shared/persistence/progression-storage.ts`, `src/screens/ResultsScreen/ResultsScreen.tsx`, `src/screens/ProgressScreen/ProgressScreen.tsx`
- [x] Phase 3, Task 3.2: Polish HUD and accessibility/readability (@ui-hud-developer)
  - Files: `src/styles/global.css`, `src/features/game/components/PromptFocusCard.tsx`, `src/features/game/components/RocketFlightCard.tsx`, `src/screens/GameScreen/GameScreen.tsx`, `src/screens/ResultsScreen/ResultsScreen.tsx`, `src/screens/ProgressScreen/ProgressScreen.tsx`, `src/app/router/RootLayout.tsx`
- [x] Phase 3, Task 3.3: Refine calibration and latency behavior (@audio-systems-engineer)
  - Files: `src/shared/config/solfege.ts`, `src/features/audio/pitch/types.ts`, `src/features/audio/pitch/classification.ts`, `src/features/audio/pitch/classification.test.ts`, `src/features/audio/pitch/usePitchMonitor.ts`, `src/features/audio/pitch/index.ts`, `src/features/audio/input/session.ts`
- [x] Phase 3, Task 3.4: Tune hazards, boosts, and run-loop balance (@gameplay-systems-engineer)
  - Files: `src/features/game/engine/contracts.ts`, `src/features/game/engine/tuning.ts`, `src/features/game/engine/simulation.ts`, `src/features/game/engine/simulation.test.ts`, `src/features/game/engine/index.ts`

- [x] Phase 3, Task 3.5: Final regression, cross-browser, and playtest validation (@qa-test-engineer)
  - Files: `src/app/AppShell.phase3.test.tsx`, `src/features/game/engine/tuning.test.ts`, `src/features/audio/pitch/calibration-integration.test.ts`, `docs/PLAYTEST-CHECKLIST.md`
- [x] README.md: Comprehensive rewrite with project overview, features, getting started, architecture, and tech stack

### Post-Phase 3: Voice Calibration Feature
- [x] Feature PRD: Voice calibration for custom frequency profiles (`docs/features/voice-calibration.md`)
- [x] Phase F1: Calibration data layer — capture types, voice profile builder, localStorage persistence
  - Files: `src/features/calibration/types.ts`, `src/features/calibration/voice-profile.ts`, `src/features/calibration/useCalibrationCapture.ts`, `src/shared/persistence/voice-profile-storage.ts`
- [x] Phase F2: Calibration UI — CalibrationScreen, NoteCaptureCard, CalibrationProgress components
  - Files: `src/screens/CalibrationScreen/CalibrationScreen.tsx`, `src/features/calibration/components/NoteCaptureCard.tsx`, `src/features/calibration/components/CalibrationProgress.tsx`
- [x] Phase F3: Gameplay integration — pitch classification uses voice profiles, difficulty config supports custom ranges
  - Files: `src/features/audio/pitch/classification.ts`, `src/shared/config/difficulty.ts`, `src/shared/config/solfege.ts`, `src/features/audio/pitch/usePitchMonitor.ts`
- [x] Phase F4: Testing — unit, integration, and acceptance tests for calibration flow
  - Files: `src/features/calibration/types.test.ts`, `src/features/calibration/voice-profile.test.ts`, `src/features/calibration/useCalibrationCapture.test.ts`, `src/shared/persistence/voice-profile-storage.test.ts`, `src/features/audio/pitch/calibration-integration.test.ts`

### Post-Phase 3: Accessibility Tuning
- [x] Wider note windows: Easy ±65 cents, Normal ±45, Hard ±35
- [x] Breathing gaps between notes: Easy 900ms, Normal 600ms, Hard 350ms
- [x] Human voice frequency filtering (85–1100 Hz)
- [x] Prompt engine breath gap support in `src/features/game/engine/prompt.ts`

### Documentation & Polish
- [x] Solfege frequency design document (`docs/solfege-frequency-design.md`)
- [x] Blog post: "Revisiting Vib'N" (`docs/blog-post-viben-revisited.md`)
- [x] Playwright screenshot capture for all screens (`docs/screenshots/`)
- [x] README walkthrough section with screenshots
- [x] Original code archived on `archive/the-original-viben` branch
- [x] Mobile viewport screenshots (iPhone 14, 390×844) added to Playwright and README
  - Files: `playwright.config.ts`, `scripts/capture-screenshots.spec.ts`, `README.md`, `docs/screenshots/06-home-mobile.png`, `docs/screenshots/07-game-mobile.png`, `docs/screenshots/08-calibration-mobile.png`

### Post-Phase 3: Tabbed Screen Views
- [x] Reusable `TabPanel` component with WAI-ARIA Tabs pattern, arrow key navigation, and roving tabIndex
  - Files: `src/shared/components/TabPanel.tsx`, `src/shared/components/TabPanel.test.tsx`
- [x] HomeScreen split into Setup and Difficulty tabs
- [x] GameScreen active-run view strips secondary panels for singing focus
- [x] ResultsScreen split into Summary and Details tabs
- [x] ProgressScreen split into Overview, Comparison, and Records tabs
- [x] Tab CSS for desktop, tablet (≤768px), phone (≤480px), and touch targets (pointer: coarse)
  - Files: `src/styles/global.css`
- [x] Updated Playwright screenshot spec to capture all tabbed sub-views (desktop + mobile)
  - Files: `scripts/capture-screenshots.spec.ts`
- [x] New screenshots: `01-home-setup.png`, `01b-home-difficulty.png`, `04-results-summary.png`, `04b-results-details.png`, `05-progress-overview.png`, `05b-progress-comparison.png`, `05c-progress-records.png`, `06b-home-difficulty-mobile.png`, `09-results-mobile.png`, `10-progress-mobile.png`
- [x] README updated with tabbed view walkthrough sections and mobile views grid
- [x] All 321 tests passing (313 original + 8 TabPanel tests)

## Current Task
None — all feature work and documentation complete.

## Phase Dependencies

| Phase | Depends On | Why |
|-------|------------|-----|
| Phase 1 — Foundation and Reuse Extraction | None | Establishes build system, shell, contracts, and reusable core modules |
| Phase 2 — Core Gameplay Prototype | Phase 1 complete | Requires migrated app shell, audio contracts, game-state primitives, and persistence scaffolding |
| Phase 3 — Replayability and Polish | Phase 2 complete | Requires a playable run loop, results flow, and stored run data before tuning and comparison work |

## Execution Plan

### Phase 1 — Foundation and Reuse Extraction
**Goal**: Leave the legacy CRA structure behind, extract reusable pitch logic, and establish the shell/contracts all later work depends on.

| Task | Agent | Planned Deliverables | Dependencies |
|------|-------|----------------------|--------------|
| 1.1 | `project-architect` | Migrate from Create React App to Vite; define app bootstrap, providers, routing shell, shared types, and package/build scripts | None |
| 1.2 | `audio-systems-engineer` | Extract microphone and pitch-detection pipeline into `src/features/audio/**`; define `solfege` config and audio adapters | 1.1 |
| 1.3 | `progression-systems-engineer` | Define difficulty config, persistence schema, and local-storage contracts in shared progression/persistence modules | 1.1 |
| 1.4 | `gameplay-systems-engineer` | Define core game-state primitives, run-loop state model, prompt contracts, and summary output contracts | 1.2, 1.3 |
| 1.5 | `ui-hud-developer` | Establish routed screen placeholders and baseline screen composition for Home/Game/Results/Progress | 1.1 |
| 1.6 | `qa-test-engineer` | Set up Vitest/test harness, browser API mocks, and baseline regression scaffolding for audio/routing/storage | 1.1, inputs from 1.2-1.4 as available |

**Phase 1 agent involvement**
- `project-architect`: foundation, shell, migration, shared contracts
- `audio-systems-engineer`: reusable pitch/mic extraction
- `progression-systems-engineer`: persistence and difficulty scaffolding
- `gameplay-systems-engineer`: game-state primitives
- `ui-hud-developer`: routed screen scaffolding
- `qa-test-engineer`: test infrastructure

**Phase 1 exit criteria**
- Modern stack replaces CRA as the intended long-term foundation
- Shell routes exist for all major screens
- Audio, gameplay, and persistence modules exist behind typed interfaces
- Test harness is ready for feature implementation

---

### Phase 2 — Core Gameplay Prototype
**Goal**: Build the first end-to-end playable loop: start run, pass mic check, play, finish, save, and review results.

| Task | Agent | Planned Deliverables | Dependencies |
|------|-------|----------------------|--------------|
| 2.1 | `audio-systems-engineer` | Implement microphone readiness flow, permission/blocked states, and live pitch classification integration | Phase 1 complete |
| 2.2 | `gameplay-systems-engineer` | Implement playable run loop: prompts, rocket response, hazards, score logic, fail/success transitions | 2.1, Phase 1 complete |
| 2.3 | `ui-hud-developer` | Build Home and Game screens with prompt display, rocket HUD, feedback indicators, and permission messaging | 2.1, 2.2 |
| 2.4 | `progression-systems-engineer` | Build results summary flow, local save on run completion, and first results-screen data model | 2.2, 2.3 |
| 2.5 | `qa-test-engineer` | Add integration and acceptance coverage for mic flow, run loop, screen states, results save, and blocked/error paths | 2.1-2.4 |

**Phase 2 agent involvement**
- `audio-systems-engineer`: live input and readiness flow
- `gameplay-systems-engineer`: first complete game loop
- `ui-hud-developer`: player-facing run experience
- `progression-systems-engineer`: result persistence and summary
- `qa-test-engineer`: acceptance/regression coverage
- `project-architect`: support only if shell/config changes are required by dependent agents

**Phase 2 exit criteria**
- Player can start a run from the home screen
- Mic readiness and denied/unsupported states work
- Live singing affects the rocket in a complete run loop
- Results are shown and persisted locally

---

### Phase 3 — Replayability and Polish
**Goal**: Add depth, retention, and quality improvements after the playable prototype is stable.

| Task | Agent | Planned Deliverables | Dependencies |
|------|-------|----------------------|--------------|
| 3.1 | `progression-systems-engineer` | Implement full difficulty system, best-score tracking, milestones, local comparison, and progress views | Phase 2 complete |
| 3.2 | `ui-hud-developer` | Polish retro HUD, improve readability/accessibility, refine results/progress UX, and strengthen visual clarity | 3.1, Phase 2 complete |
| 3.3 | `audio-systems-engineer` | Tune calibration/refinement flows and optimize latency-sensitive audio behavior | Phase 2 complete |
| 3.4 | `gameplay-systems-engineer` | Tune hazard balance, boost pacing, difficulty behavior, and run-loop feel using progression/audio inputs | 3.1, 3.3 |
| 3.5 | `qa-test-engineer` | Full regression pass, cross-browser checks, manual playtest checklist, and quality gate review against PRD acceptance criteria | 3.1-3.4 |

**Phase 3 agent involvement**
- `progression-systems-engineer`: replayability and long-term retention
- `ui-hud-developer`: polish and accessibility improvements
- `audio-systems-engineer`: calibration and latency refinement
- `gameplay-systems-engineer`: tuning and balance
- `qa-test-engineer`: final validation
- `project-architect`: only if supporting architectural cleanup is required

**Phase 3 exit criteria**
- Difficulty and local comparison are working
- HUD/readability/accessibility improvements are in place
- Audio/gameplay are tuned for responsiveness and clarity
- Final QA coverage and manual validation are complete

## Agent Task Summary

| Agent | Primary Responsibilities in Execution Plan | First Phase Active |
|-------|--------------------------------------------|--------------------|
| `project-architect` | Stack migration, app shell, routing, providers, shared types, compatibility guardrails | Phase 1 |
| `audio-systems-engineer` | Mic permission, audio input, pitch detection, calibration, latency-sensitive audio contracts | Phase 1 |
| `gameplay-systems-engineer` | Prompt logic, rocket/run loop, hazards, success/failure, game-state contracts | Phase 1 |
| `ui-hud-developer` | Home/game screens, HUD, feedback presentation, accessibility/readability | Phase 1 |
| `progression-systems-engineer` | Difficulty, persistence, results, best scores, local comparison, progress views | Phase 1 |
| `qa-test-engineer` | Test harness, acceptance/regression coverage, playtest and cross-browser validation | Phase 1 |

## Remaining
None — all tasks complete.

## Blockers
- None

## Notes
- The existing repository still contains legacy CRA assumptions, but the PRD requires migration to a modern stack in Phase 1.
- Previously verified tech-stack observations from the PRD: React 19.x is current, React Router 7.x is current, TypeScript 6.x is current, `pitchfinder` 2.3.x is current, and Create React App is deprecated.
- The first implementation dependency chain is: `project-architect` -> (`audio-systems-engineer` and `progression-systems-engineer`) -> `gameplay-systems-engineer` -> `ui-hud-developer` -> `qa-test-engineer`.
- Baseline verification before Phase 1 execution: `npm run build` succeeded, and `npm test -- --watchAll=false` exited with "No tests found".
- Task 1.1 verification on the new foundation: `npm run typecheck`, `npm run build`, and `npm run test` all passed on the Vite/Vitest setup.
- Task 1.2 verification: `npm run typecheck`, `npm run build`, and `npm run test` passed after extracting the audio foundation.
- Task 1.3 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 7 progression foundation tests.
- Task 1.4 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 12 total tests after adding gameplay foundation coverage.
- Task 1.5 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed after upgrading the routed shell UI and HUD placeholders.
- Task 1.6 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 18 total tests after adding the shared test harness and baseline integration coverage.
- Task 2.1 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 24 total tests after adding shared audio state, readiness selectors, and pitch-target integration contracts.
- Task 2.2 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 32 total tests after adding the deterministic run loop, controller/state selectors, and gameplay end-state outputs.
- Task 2.3 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 35 total tests after upgrading the Home/Game launch flow, in-run HUD, and UI route coverage.
- Task 2.4 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 38 total tests after wiring real results persistence, route-backed results summaries, and local progress/history comparison views.
- Task 2.5 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 40 total tests after adding Phase 2 app-shell acceptance coverage for full run-to-results persistence and denied-microphone recovery.
- Task 3.1 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 84 total tests after adding milestone detection, enhanced selectors, and difficulty progression.
- Task 3.2 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 84 total tests after polishing retro HUD, improving accessibility (aria-live, skip-link, focus-visible), and refining Results/Progress UX.
- Task 3.3 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 104 total tests after adding calibration presets, confidence scoring, and latency optimization.
- Task 3.4 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 122 total tests after adding new hazards/boosts and rebalancing gameplay tuning.
- Task 3.5 verification: `npm run typecheck`, `npm run test`, and `npm run build` passed with 207 total tests after final regression, integration, calibration, and privacy assertion tests.
- All 3 phases (17 tasks) complete. 207 tests across 18 test files. Build output: 378 KB JS, 12 KB CSS.
- Branch `feat/rework-rocket` pushed to remote on 2026-04-18.

---

## Feature: Mobile Support & UI Refresh

### Feature Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| F1 | HUD Simplification & Rocket Visual Feedback | ✅ Complete |
| F2 | Responsive Layout & Touch Support | ✅ Complete |
| F3 | Mobile Audio Handling | ✅ Complete |
| F4 | First-Run Contextual Tooltips | ✅ Complete |

### Phase F1 — Completed Tasks

- [x] F1.1: Create RocketSprite component (`src/features/game/components/RocketSprite.tsx`)
- [x] F1.7: Add rocket animation CSS (`src/styles/global.css`)
- [x] F1.3: Add inline prompt-hold to PromptFocusCard (`src/features/game/components/PromptFocusCard.tsx`)
- [x] F1.2: Update RocketFlightCard to use RocketSprite (`src/features/game/components/RocketFlightCard.tsx`)
- [x] F1.4: Remove Thrust and Prompt Hold HudMeters from GameScreen
- [x] F1.5: Hide Mission Checklist and Mic Readout during active gameplay
- [x] F1.6: Consolidate action buttons (context-sensitive button row)
- [x] F1.8: Update existing tests for simplified HUD (`src/screens/GameScreen/GameScreen.test.tsx`)
- [x] Export RocketSprite from barrel (`src/features/game/components/index.ts`)

### Phase F1 — Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run test -- --run` | ✅ 266 passed, 0 failures |
| `npm run build` | ✅ Built successfully |

### Phase F1 — Notes
- RocketSprite uses `matchState` (not normalized thrustPercent) for flame color
- All rocket animations respect `prefers-reduced-motion`
- 3 pre-existing test failures (AppShell ×2, ResultsScreen ×1) were resolved by button consolidation
- Branch `feat/ui-mobile-suppot` pushed to remote on 2026-04-19.

### Phase F2 — Completed Tasks

- [x] F2.1: Add responsive CSS breakpoints — tablet ≤768px, phone ≤480px (`src/styles/global.css`)
- [x] F2.2: Convert `.hero` grid to single-column stack on mobile
- [x] F2.3: Convert `.screen-grid`, `.metric-grid`, `.run-stat-grid` to responsive single-column on mobile
- [x] F2.4: Implement `@media (pointer: coarse)` rules for 44×44px minimum touch targets
- [x] F2.5: Create `useViewport` hook with `matchMedia`-based breakpoint detection (`src/shared/hooks/useViewport.ts`)
- [x] F2.6: Add portrait and landscape orientation support via `@media (orientation: landscape)`
- [x] F2.7: Adjust `.rocket-track` min-height for mobile (12rem tablet, 9rem phone, 8rem landscape)
- [x] F2.8: Add overflow prevention (`overflow-x: hidden` on html, `overflow-wrap: break-word`)
- [x] F2.9: Add useViewport tests (`src/shared/hooks/useViewport.test.ts` — 6 tests)
- [x] F2.10: Create barrel export (`src/shared/hooks/index.ts`)

### Phase F2 — Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run test -- --run` | ✅ 272 passed (266 + 6 new), 0 failures |
| `npm run build` | ✅ Built successfully (396 KB JS, 18.6 KB CSS) |

### Phase F2 — Notes
- All responsive behavior is CSS-only (no JSX changes needed) — best for performance (FT-NF-01)
- Touch targets coexist with existing `:focus-visible` keyboard styling (FT-NF-04)
- Replaced old 800px breakpoint with comprehensive 768px/480px system
- `useViewport` hook uses `matchMedia` (not `resize` events) to stay in sync with CSS breakpoints

### Phase F3 — Completed Tasks

- [x] F3.1: Add `resumeOnGesture()` utility to `session.ts` for iOS Safari AudioContext gesture gate
- [x] F3.2: Integrate gesture-based AudioContext resume into `createAudioInputSession()` and `ensureRunning()`
- [x] F3.3: Add `isMobileDevice()` helper and mobile-aware `autoGainControl` defaults (true on mobile, false on desktop)
- [x] F3.4: Add background-tab recovery via `visibilitychange` with `onAudioResumed` callback
- [x] F3.5: Update HomeScreen guidance copy with mobile-specific instructions for blocked/unsupported/error states
- [x] F3.6: Add 17 unit tests for mobile audio features (`src/features/audio/input/session.test.ts`)

### Phase F3 — Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run test -- --run` | ✅ 313 passed, 0 failures |
| `npm run build` | ✅ Built successfully |

### Phase F3 — Notes
- `isMobileDevice()` uses `navigator.maxTouchPoints > 0` (not user-agent sniffing)
- `resumeOnGesture()` attaches one-shot `click`/`touchstart` listeners — no per-frame cost
- `visibilitychange` listener cleaned up in `close()`
- No changes to the `readFrame()` hot path — NF-01 latency budget preserved

### Phase F4 — Completed Tasks

- [x] F4.1: Create `Tooltip` component (`src/shared/components/Tooltip.tsx`) — viewport-aware positioning, keyboard accessible (Escape), "Got it" + "Skip all tips"
- [x] F4.2: Create `useFirstRunTooltips` hook (`src/shared/hooks/useFirstRunTooltips.ts`) — sequenced display, localStorage persistence, corrupt data recovery
- [x] F4.3: Add tooltip triggers to GameScreen — refs on PromptFocusCard, Stability meter, RocketFlightCard, Moon Progress meter
- [x] F4.4: Add tooltip CSS to `global.css` — retro aesthetic, responsive, `prefers-reduced-motion` guard, z-index 2000
- [x] F4.5: Add 24 tests — 13 for useFirstRunTooltips, 11 for Tooltip component

### Phase F4 — Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run test -- --run` | ✅ 313 passed (272 + 41 new across F3+F4), 0 failures |
| `npm run build` | ✅ Built successfully (402 KB JS, 20.5 KB CSS) |

### Phase F4 — Notes
- Tooltips show sequentially: prompt-card → stability-meter → rocket-feedback → moon-progress
- Only displayed during active gameplay (not pre-run or post-run)
- `viben:tooltips-seen` follows existing persistence conventions with graceful error recovery
- Tooltip component uses `aria-live="polite"` and auto-focuses dismiss button for screen readers
