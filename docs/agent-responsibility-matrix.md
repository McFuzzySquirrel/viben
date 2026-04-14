# Agent Responsibility Matrix

This document validates the generated specialist agent team against [docs/PRD.md](./PRD.md).

## Validation Result

| Check | Result | Notes |
|-------|--------|-------|
| Every PRD requirement/acceptance ID has exactly one primary owner | Pass | 52 of 52 IDs mapped in PRD Section 7.5 |
| Ownership gaps | Pass | No unowned IDs |
| Duplicate ownership rows in PRD matrix | Pass | No duplicated IDs in the canonical matrix |
| Non-specialist agent assigned as a primary owner | Pass | Only specialist agents own PRD IDs |
| Agent files explicitly declare their primary IDs | Pass | All specialist agents include explicit primary ID lists |
| Conflicting file-path ownership between specialist agents | Pass | No overlapping owned file paths across specialist agents |
| Collaboration sections present | Pass | All specialist agents include `## Collaboration` |

## Specialist Agent Boundary Summary

| Agent | Primary Domain | Owned Files / Areas | Primary PRD IDs | Notes |
|-------|----------------|---------------------|-----------------|-------|
| `project-architect` | Foundation, tooling, app shell, architecture constraints | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/app/router/**`, `src/app/providers/**`, `src/shared/types/**` | NF-03, NF-05, SP-07, AC-13 | Owns stack migration, app shell, and cross-cutting architecture |
| `audio-systems-engineer` | Microphone capture, pitch detection, calibration, audio privacy | `src/features/audio/input/**`, `src/features/audio/pitch/**`, `src/shared/config/solfege.ts`, `src/features/audio/**` | GM-02, GM-04, ST-01, ST-03, NF-01, NF-06, SP-01, SP-02, SP-06, AC-02, AC-04, AC-05, AC-06 | Owns real-time singing input and blocked/ready states |
| `gameplay-systems-engineer` | Core run loop, prompts, rocket behavior, hazards, state transitions | `src/features/game/engine/**`, `src/features/game/state/**` | GM-03, GM-05, GM-06, GM-07, GM-09, NF-02, AC-07, AC-08, AC-09 | Owns game rules and run-state logic |
| `ui-hud-developer` | Home/game screens, HUD, player-facing accessibility and messaging | `src/screens/HomeScreen/**`, `src/screens/GameScreen/**`, `src/features/game/components/**`, `src/assets/ui/**` | GM-01, FR-01, FR-02, NF-07, NF-08, SP-04, ACC-01, ACC-02, ACC-03, ACC-04, AC-01 | Owns player-facing runtime UI |
| `progression-systems-engineer` | Difficulty, local persistence, results, progress, comparison | `src/features/settings/**`, `src/shared/config/difficulty.ts`, `src/features/progression/**`, `src/features/leaderboard/**`, `src/screens/ResultsScreen/**`, `src/screens/ProgressScreen/**`, `src/shared/persistence/**` | GM-08, FR-03, FR-04, PR-01, PR-02, PR-03, PR-04, ST-02, NF-04, SP-03, SP-05, AC-03, AC-10, AC-11, AC-12 | Owns replayability and local progression |
| `qa-test-engineer` | Test harness, regression coverage, acceptance verification | `vitest.config.*`, `src/test/**`, `tests/**`, `src/**/*.test.ts`, `src/**/*.test.tsx` | None by design | Verification owner, not a primary feature owner |

## Supporting Agents

| Agent | Role in Team | Owns PRD Requirements? |
|-------|--------------|------------------------|
| `project-orchestrator` | Coordinates implementation order and handoffs | No |
| `forge-team-builder` | Generates and evolves agent teams | No |

## Detailed Requirement Ownership Matrix

| ID | Category | Primary Owner Agent | Notes |
|----|----------|---------------------|-------|
| GM-01 | Functional | `ui-hud-developer` | Start flow and home-screen interaction |
| GM-02 | Functional | `audio-systems-engineer` | Microphone permission and pre-game audio readiness |
| GM-03 | Functional | `gameplay-systems-engineer` | Prompt generation and target-note game rules |
| GM-04 | Functional | `audio-systems-engineer` | Pitch detection and note-range matching |
| GM-05 | Functional | `gameplay-systems-engineer` | Positive rocket response to correct pitch |
| GM-06 | Functional | `gameplay-systems-engineer` | Negative response to incorrect or missing pitch |
| GM-07 | Functional | `gameplay-systems-engineer` | Hazards, penalties, and boosts |
| GM-08 | Functional | `progression-systems-engineer` | Difficulty model and challenge tuning inputs |
| GM-09 | Functional | `gameplay-systems-engineer` | Run end-state and completion logic |
| FR-01 | Functional | `ui-hud-developer` | In-run correctness feedback presentation |
| FR-02 | Functional | `ui-hud-developer` | Altitude and moon-progress display |
| FR-03 | Functional | `progression-systems-engineer` | Results screen summary model and output |
| FR-04 | Functional | `progression-systems-engineer` | Accuracy/time-on-target reporting |
| PR-01 | Functional | `progression-systems-engineer` | Local run-history persistence |
| PR-02 | Functional | `progression-systems-engineer` | Local comparison flow |
| PR-03 | Functional | `progression-systems-engineer` | Best scores and milestone tracking |
| PR-04 | Functional | `progression-systems-engineer` | Optional unlockable progression |
| ST-01 | Functional | `audio-systems-engineer` | Microphone readiness flow |
| ST-02 | Functional | `progression-systems-engineer` | Difficulty selection and persistence |
| ST-03 | Functional | `audio-systems-engineer` | Advanced pitch calibration controls |
| NF-01 | Non-Functional | `audio-systems-engineer` | Pitch-to-feedback latency budget ownership |
| NF-02 | Non-Functional | `gameplay-systems-engineer` | Run-loop performance and render safety |
| NF-03 | Non-Functional | `project-architect` | Modular architecture and project boundaries |
| NF-04 | Non-Functional | `progression-systems-engineer` | Storage durability and invalid-data recovery |
| NF-05 | Non-Functional | `project-architect` | Supported-browser compatibility baseline |
| NF-06 | Non-Functional | `audio-systems-engineer` | Blocked/error state from unsupported audio access |
| NF-07 | Non-Functional | `ui-hud-developer` | Pointer-free menu/setup usability |
| NF-08 | Non-Functional | `ui-hud-developer` | HUD readability at supported resolutions |
| SP-01 | Security / Privacy | `audio-systems-engineer` | Explicit microphone-permission handling |
| SP-02 | Security / Privacy | `audio-systems-engineer` | Local-only audio processing |
| SP-03 | Security / Privacy | `progression-systems-engineer` | Local-save data minimization |
| SP-04 | Security / Privacy | `ui-hud-developer` | Player-facing permission messaging |
| SP-05 | Security / Privacy | `progression-systems-engineer` | No PII in saved data model |
| SP-06 | Security / Privacy | `audio-systems-engineer` | No raw audio or voiceprint persistence |
| SP-07 | Security / Privacy | `project-architect` | No third-party telemetry SDK introduction in v1 |
| ACC-01 | Accessibility | `ui-hud-developer` | Keyboard-accessible menus and shell UI |
| ACC-02 | Accessibility | `ui-hud-developer` | Readable text and HUD contrast |
| ACC-03 | Accessibility | `ui-hud-developer` | Prompts not dependent on color alone |
| ACC-04 | Accessibility | `ui-hud-developer` | Reduced-motion support if motion is added |
| AC-01 | Acceptance | `ui-hud-developer` | Home-screen and app-shell completion |
| AC-02 | Acceptance | `audio-systems-engineer` | Setup flow blocked/ready handling |
| AC-03 | Acceptance | `progression-systems-engineer` | Difficulty selection applied to runs |
| AC-04 | Acceptance | `audio-systems-engineer` | Microphone capture start without reload |
| AC-05 | Acceptance | `audio-systems-engineer` | Pitch mapped to solfege windows |
| AC-06 | Acceptance | `audio-systems-engineer` | Silence and unusable input classification |
| AC-07 | Acceptance | `gameplay-systems-engineer` | Prompt-driven rocket behavior |
| AC-08 | Acceptance | `gameplay-systems-engineer` | Cohesive run loop with score and hazards |
| AC-09 | Acceptance | `gameplay-systems-engineer` | Success/failure transitions |
| AC-10 | Acceptance | `progression-systems-engineer` | Results metrics and rating output |
| AC-11 | Acceptance | `progression-systems-engineer` | Persistent run-history reload |
| AC-12 | Acceptance | `progression-systems-engineer` | Local comparison without auth/network |
| AC-13 | Acceptance | `project-architect` | Migration away from CRA to documented stack |

## Conflict Review

| Validation Area | Result | Notes |
|-----------------|--------|-------|
| Requirement ownership conflicts | None | Every PRD ID appears once with one primary owner |
| Specialist file-path conflicts | None | Owned file paths are disjoint across specialist agents |
| Responsibility overlap concerns | None requiring changes | Collaboration exists where inputs/outputs cross domains, but ownership remains singular |

