# Project Progress

## Current State
**Mode**: Full Build  
**Phase**: Phase 1 — Foundation and Reuse Extraction  
**Status**: In Progress  
**Last Updated**: 2026-04-14T21:06:26.736Z  
**PRD**: `docs/PRD.md`

## Completed Tasks
- [x] Execution planning completed (@project-orchestrator)
  - Files: `docs/PROGRESS.md`
- [x] Phase 1, Task 1.1: Foundation migration and app shell setup (@project-architect)
  - Files: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/App.tsx`, `src/app/**`, `src/screens/**`, `src/shared/types/**`, `src/shared/config/privacy.ts`, `src/styles/global.css`, `src/components/VoiceInput.tsx`
- [x] Phase 1, Task 1.2: Extract microphone and pitch-detection pipeline (@audio-systems-engineer)
  - Files: `src/shared/config/solfege.ts`, `src/features/audio/**`, `src/screens/GameScreen/GameScreen.tsx`

## Current Task
- [ ] Phase 1, Task 1.3: Define difficulty and persistence contracts (@progression-systems-engineer)
  - Status: In progress
  - Notes: Audio and solfege contracts are now in place; progression work can define difficulty and local-storage contracts for gameplay/results consumers.

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
- [ ] Phase 1, Task 1.2: Extract microphone and pitch-detection pipeline
- [ ] Phase 1, Task 1.3: Define difficulty and persistence contracts
- [ ] Phase 1, Task 1.4: Define game-state primitives and integration contracts
- [ ] Phase 1, Task 1.5: Establish routed screen placeholders
- [ ] Phase 1, Task 1.6: Establish test harness and mocks
- [ ] Phase 2, Task 2.1: Implement microphone readiness and live pitch integration
- [ ] Phase 2, Task 2.2: Implement playable run loop
- [ ] Phase 2, Task 2.3: Build Home/Game screens and HUD
- [ ] Phase 2, Task 2.4: Build results and save flow
- [ ] Phase 2, Task 2.5: Add integration and acceptance coverage
- [ ] Phase 3, Task 3.1: Implement difficulty progression and comparison
- [ ] Phase 3, Task 3.2: Polish HUD and accessibility/readability
- [ ] Phase 3, Task 3.3: Refine calibration and latency behavior
- [ ] Phase 3, Task 3.4: Tune hazards, boosts, and run-loop balance
- [ ] Phase 3, Task 3.5: Final regression, cross-browser, and playtest validation

## Blockers
- None

## Notes
- The existing repository still contains legacy CRA assumptions, but the PRD requires migration to a modern stack in Phase 1.
- Previously verified tech-stack observations from the PRD: React 19.x is current, React Router 7.x is current, TypeScript 6.x is current, `pitchfinder` 2.3.x is current, and Create React App is deprecated.
- The first implementation dependency chain is: `project-architect` -> (`audio-systems-engineer` and `progression-systems-engineer`) -> `gameplay-systems-engineer` -> `ui-hud-developer` -> `qa-test-engineer`.
- Baseline verification before Phase 1 execution: `npm run build` succeeded, and `npm test -- --watchAll=false` exited with "No tests found".
- Task 1.1 verification on the new foundation: `npm run typecheck`, `npm run build`, and `npm run test` all passed on the Vite/Vitest setup.
- Task 1.2 verification: `npm run typecheck`, `npm run build`, and `npm run test` passed after extracting the audio foundation.
