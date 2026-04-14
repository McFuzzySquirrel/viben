# Vib'N: Rocket to the Moon

## 1. Overview

**Product Name:** Vib'N: Rocket to the Moon  
**Summary:** A retro-inspired singing game that turns solfege note matching into a rocket flight challenge. Players use their voice to match prompted notes such as do, re, mi, fa, sol, la, and ti to keep a rocket stable, avoid hazards, collect boosts, and reach the moon. The project reworks the existing Vib'N pitch-training prototype into a more game-like, replayable experience while preserving its strongest reusable mechanic: real-time microphone pitch detection in the browser.  
**Target Platform:** Web prototype first, optimized for desktop browsers, with future potential for desktop packaging.  
**Key Constraints:** Browser microphone access is required for core gameplay, v1 stores progress locally only, no online multiplayer is included, and the legacy Create React App stack should not be the long-term foundation.

---

## 2. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.2 | 2026-04-14 | Copilot | Added specialist agent ownership matrix for all requirement and acceptance IDs |
| 1.1 | 2026-04-14 | Copilot | Gap review pass: added component traceability, stronger acceptance criteria, measurable non-functional targets, and explicit phase coverage |
| 1.0 | 2026-04-14 | Copilot | Initial PRD |

Track document revisions so readers know what changed and when.

---

## 3. Goals and Non-Goals

### 3.1 Goals
- Rework the existing Vib'N prototype into a fun arcade-style singing game.
- Use solfege note prompts as the core player input mechanic.
- Turn pitch matching into a clear game loop with upward rocket progress toward the moon.
- Preserve and improve the existing browser-based microphone pitch detection workflow.
- Provide replayable local progression through scoring, stars, difficulty, and session history.
- Support local run comparison for players sharing the same device.

### 3.2 Non-Goals
- Online multiplayer, matchmaking, or cloud leaderboards.
- Advanced song-analysis or uploaded-song gameplay in v1.
- User accounts, authentication, or cross-device sync.
- A polished desktop app release in v1.
- Full accessibility certification for the prototype, though basic good practices should still be followed.

---

## 4. User Stories / Personas

### 4.1 Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| Casual Challenger | A player who wants a quick, playful game session. | Immediate feedback, simple onboarding, satisfying score progression |
| Beginner Singer | A player using the game to practice pitch accuracy. | Clear note prompts, understandable success/failure cues, repeatable drills |
| Couch Competitor | Two or more local players taking turns on one machine. | Easy handoff between runs, score summaries, simple comparison |

### 4.2 User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-01 | Casual Challenger | start a run quickly with microphone input | I can play without setup friction | Must |
| US-02 | Beginner Singer | see and hear which solfege note I should match | I know what to sing next | Must |
| US-03 | Beginner Singer | get immediate rocket feedback from my pitch accuracy | I understand whether I am succeeding | Must |
| US-04 | Casual Challenger | avoid hazards and collect boosts while singing | the game feels dynamic instead of static training | Must |
| US-05 | Couch Competitor | compare my run with previous local runs | I can compete on one device | Should |
| US-06 | Beginner Singer | choose an easier or harder difficulty | the challenge matches my ability | Must |
| US-07 | Returning Player | keep local progress and prior results | I can see improvement over time | Should |

---

## 5. Research Findings

The current repository is a useful prototype, not a finished game foundation. Existing code already proves that browser-based pitch detection with solfege mapping is viable and gives a head start on the core interaction model.

### Reuse Assessment

| Existing Asset | Current State | Reuse Decision | Notes |
|----------------|--------------|----------------|-------|
| `VoiceInput.tsx` microphone + Web Audio + `pitchfinder` flow | Core mechanic works | Reuse concept, refactor implementation | This is the most valuable existing system |
| Solfege pitch ranges in `App.tsx` | Hardcoded and UI-coupled | Reuse domain concept | Move into shared note/game config |
| Pitch bars / needle feedback | Functional but training-oriented | Reuse visual pattern | Redesign as rocket stability, thrust, or targeting HUD |
| Session timing and score summaries | In-memory only | Reuse idea, rebuild storage model | Good basis for local run history |
| Router-based multi-screen shell | Basic but workable | Reuse concept | Likely rebuilt under newer app structure |
| Upload song / vibration controls | Incomplete and hidden | Exclude from v1 | Explicit non-goal for first game release |

### Technology Currency

| Technology | Current Repo Version | Current Stable / Latest Observed | Assessment |
|------------|----------------------|----------------------------------|------------|
| React | 18.2.0 | 19.2.5 | Upgrade recommended |
| React Router DOM | 7.0.1 | 7.14.1 | Upgrade recommended |
| TypeScript | 4.9.5 | 6.0.2 | Upgrade recommended |
| `pitchfinder` | 2.3.2 | 2.3.4 | Minor upgrade recommended |
| `react-scripts` / Create React App | 5.0.1 | 5.0.1, but CRA deprecated by React team in 2025 | Migrate away from CRA |

### Key Conclusions
- The microphone pitch-detection mechanic is worth preserving.
- The current app structure is too monolithic for a game and should be reorganized around gameplay state, scenes, and reusable audio/game modules.
- Create React App is no longer a good strategic base; the PRD assumes migration to a modern build setup such as Vite for the rework.
- The existing visual language can inform a retro game UI, but the note bars should become gameplay feedback rather than the main destination UI.

---

## 6. Concept

### 6.1 Core Loop / Workflow

1. Player opens the game and starts a run.
2. Game requests microphone permission and performs a short input check.
3. Player receives a target solfege note prompt.
4. Game analyzes live pitch input and maps it to the active note window.
5. Correct singing stabilizes or boosts the rocket; incorrect singing causes drift, slowdown, or hazard exposure.
6. The game rotates prompts, hazards, and boosts as the rocket climbs.
7. Run ends when the player reaches the moon, runs out of stability/health, or fails a mission condition.
8. Score, stars, note accuracy, and local leaderboard/progress are shown.

Text flow:

`Start Run -> Mic Check -> Prompt Note -> Sing -> Rocket Responds -> Resolve Hazards/Boosts -> Advance Altitude -> Summary`

### 6.2 Success / Completion Criteria

From the player perspective, the game is successful when they can start a run, understand what to sing, see the rocket respond immediately, finish with a clear result, and review their progress or compare with a local rival.

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Component | Technology | Version Notes |
|-----------|------------|---------------|
| UI Framework | React | Target current React 19 line |
| Language | TypeScript | Target current TypeScript 6 line |
| Build Tool | Vite | Proposed replacement for deprecated CRA stack |
| Routing / Screen Shell | React Router | Current 7.x line |
| Audio Input | Web Audio API + MediaDevices | Browser-native |
| Pitch Detection | `pitchfinder` or equivalent maintained library | Keep existing approach unless performance testing requires change |
| Persistence | `localStorage` or IndexedDB wrapper | Local-only for v1 |
| Styling | CSS modules or structured app CSS | Keep simple unless complexity grows |
| Testing | Vitest + React Testing Library + manual playtesting | Proposed modern test stack for rework |

### 7.2 Project Structure

```text
src/
  app/
    router/
    providers/
  features/
    game/
      engine/
      state/
      components/
    audio/
      input/
      pitch/
    progression/
    leaderboard/
    settings/
  screens/
    HomeScreen/
    GameScreen/
    ResultsScreen/
    ProgressScreen/
  shared/
    config/
    hooks/
    utils/
    types/
  assets/
```

### 7.3 Key APIs / Interfaces

| API / Interface | Purpose |
|-----------------|---------|
| `navigator.mediaDevices.getUserMedia` | Request live microphone input |
| Web Audio `AudioContext` + `AnalyserNode` | Sample audio frames for pitch analysis |
| Pitch detection adapter | Convert raw audio buffers into usable note/pitch data |
| Game state store | Coordinate prompts, rocket state, hazards, score, and end conditions |
| Local persistence service | Save run history, stars, unlocked difficulty, and local comparison data |

### 7.4 Major Component Coverage Matrix

| Major Component | Scope | Primary Stack | Acceptance Criteria | NFR / Security / Privacy Coverage | Delivery Phase |
|----------------|-------|---------------|---------------------|-----------------------------------|----------------|
| App Shell and Run Setup | Home screen, routing, difficulty select, microphone readiness, blocked states | React 19, React Router 7, TypeScript, browser permission APIs | AC-01, AC-02, AC-03 | NF-03, NF-06, NF-07, SP-01, SP-04, ACC-01 | Phases 1-2 |
| Audio Capture and Pitch Detection | Microphone input, audio sampling, pitch-to-solfege mapping, silence handling | MediaDevices, Web Audio API, `pitchfinder` adapter, TypeScript | AC-04, AC-05, AC-06 | NF-01, NF-03, SP-02, SP-06 | Phases 1-2 |
| Gameplay Engine and HUD | Rocket movement, prompts, hazards, boosts, scoring, in-run feedback | React 19, TypeScript state/store, CSS transforms or lightweight canvas-style rendering | AC-07, AC-08, AC-09 | NF-01, NF-02, NF-08, SP-02 | Phases 1-2 |
| Results, Progression, and Local Comparison | Run summary, stars, history, local bests, comparison views | React 19, TypeScript, local persistence adapter | AC-10, AC-11, AC-12 | NF-04, NF-05, SP-03, SP-05, ACC-02 | Phases 2-3 |
| Shared Config and Persistence | Difficulty tuning, note windows, save schema, migration helpers | TypeScript config modules, `localStorage` with optional IndexedDB abstraction | AC-03, AC-11, AC-12, AC-13 | NF-04, NF-05, SP-03, SP-06 | Phases 1-3 |

### 7.5 Requirement Ownership Matrix

Every requirement and acceptance ID in this PRD has one primary owner agent. Supporting agents may collaborate, but ownership remains singular.

| ID | Primary Owner Agent | Notes |
|----|---------------------|-------|
| GM-01 | `ui-hud-developer` | Start flow and home-screen interaction |
| GM-02 | `audio-systems-engineer` | Microphone permission and pre-game audio readiness |
| GM-03 | `gameplay-systems-engineer` | Prompt generation and target-note game rules |
| GM-04 | `audio-systems-engineer` | Pitch detection and note-range matching |
| GM-05 | `gameplay-systems-engineer` | Positive rocket response to correct pitch |
| GM-06 | `gameplay-systems-engineer` | Negative response to incorrect or missing pitch |
| GM-07 | `gameplay-systems-engineer` | Hazards, penalties, and boosts |
| GM-08 | `progression-systems-engineer` | Difficulty model and challenge tuning inputs |
| GM-09 | `gameplay-systems-engineer` | Run end-state and completion logic |
| FR-01 | `ui-hud-developer` | In-run correctness feedback presentation |
| FR-02 | `ui-hud-developer` | Altitude and moon-progress display |
| FR-03 | `progression-systems-engineer` | Results screen summary model and output |
| FR-04 | `progression-systems-engineer` | Accuracy/time-on-target reporting |
| PR-01 | `progression-systems-engineer` | Local run-history persistence |
| PR-02 | `progression-systems-engineer` | Local comparison flow |
| PR-03 | `progression-systems-engineer` | Best scores and milestone tracking |
| PR-04 | `progression-systems-engineer` | Optional unlockable progression |
| ST-01 | `audio-systems-engineer` | Microphone readiness flow |
| ST-02 | `progression-systems-engineer` | Difficulty selection and persistence |
| ST-03 | `audio-systems-engineer` | Advanced pitch calibration controls |
| NF-01 | `audio-systems-engineer` | Pitch-to-feedback latency budget ownership |
| NF-02 | `gameplay-systems-engineer` | Run-loop performance and render safety |
| NF-03 | `project-architect` | Modular architecture and project boundaries |
| NF-04 | `progression-systems-engineer` | Storage durability and invalid-data recovery |
| NF-05 | `project-architect` | Supported-browser compatibility baseline |
| NF-06 | `audio-systems-engineer` | Blocked/error state from unsupported audio access |
| NF-07 | `ui-hud-developer` | Pointer-free menu/setup usability |
| NF-08 | `ui-hud-developer` | HUD readability at supported resolutions |
| SP-01 | `audio-systems-engineer` | Explicit microphone-permission handling |
| SP-02 | `audio-systems-engineer` | Local-only audio processing |
| SP-03 | `progression-systems-engineer` | Local-save data minimization |
| SP-04 | `ui-hud-developer` | Player-facing permission messaging |
| SP-05 | `progression-systems-engineer` | No PII in saved data model |
| SP-06 | `audio-systems-engineer` | No raw audio or voiceprint persistence |
| SP-07 | `project-architect` | No third-party telemetry SDK introduction in v1 |
| ACC-01 | `ui-hud-developer` | Keyboard-accessible menus and shell UI |
| ACC-02 | `ui-hud-developer` | Readable text and HUD contrast |
| ACC-03 | `ui-hud-developer` | Prompts not dependent on color alone |
| ACC-04 | `ui-hud-developer` | Reduced-motion support if motion is added |
| AC-01 | `ui-hud-developer` | Home-screen and app-shell completion |
| AC-02 | `audio-systems-engineer` | Setup flow blocked/ready handling |
| AC-03 | `progression-systems-engineer` | Difficulty selection applied to runs |
| AC-04 | `audio-systems-engineer` | Microphone capture start without reload |
| AC-05 | `audio-systems-engineer` | Pitch mapped to solfege windows |
| AC-06 | `audio-systems-engineer` | Silence and unusable input classification |
| AC-07 | `gameplay-systems-engineer` | Prompt-driven rocket behavior |
| AC-08 | `gameplay-systems-engineer` | Cohesive run loop with score and hazards |
| AC-09 | `gameplay-systems-engineer` | Success/failure transitions |
| AC-10 | `progression-systems-engineer` | Results metrics and rating output |
| AC-11 | `progression-systems-engineer` | Persistent run-history reload |
| AC-12 | `progression-systems-engineer` | Local comparison without auth/network |
| AC-13 | `project-architect` | Migration away from CRA to documented stack |

---

## 8. Functional Requirements

### Gameplay

| ID | Requirement | Priority |
|----|-------------|----------|
| GM-01 | The system must allow the player to start a singing run from a home screen. | Must |
| GM-02 | The system must request microphone permission before gameplay begins. | Must |
| GM-03 | The system must present a current target note using solfege terminology. | Must |
| GM-04 | The system must analyze live pitch input and determine whether the player is within the target note range. | Must |
| GM-05 | Correct pitch input must positively affect rocket movement, stability, score, or altitude. | Must |
| GM-06 | Incorrect or missing pitch input must negatively affect rocket control in a readable way. | Must |
| GM-07 | The game must include hazards, penalties, boosts, or equivalent gameplay events tied to run progression. | Must |
| GM-08 | The game must support multiple difficulty levels that adjust challenge variables such as tolerance windows, prompt speed, and hazard frequency. | Must |
| GM-09 | The game must define a run end state and a successful completion state. | Must |

### Feedback and Results

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | The UI must display immediate feedback indicating whether the current note is correct, incorrect, or missing. | Must |
| FR-02 | The UI must show rocket progress toward the moon during play. | Must |
| FR-03 | The end-of-run screen must display score, stars or rating, and summary stats. | Must |
| FR-04 | Summary stats should include note accuracy or time-on-target metrics meaningful to improvement. | Should |

### Progression and Comparison

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-01 | The system must store run history locally on the player device. | Should |
| PR-02 | The system must support local comparison of multiple runs or players on one device. | Should |
| PR-03 | The system should track best scores and completion milestones by difficulty. | Should |
| PR-04 | The system could unlock cosmetic or difficulty progression based on performance. | Could |

### Settings and Onboarding

| ID | Requirement | Priority |
|----|-------------|----------|
| ST-01 | The system must provide a basic pre-run microphone readiness flow. | Must |
| ST-02 | The system should allow the player to select difficulty before starting a run. | Should |
| ST-03 | The system could expose advanced note calibration settings for practice-oriented players. | Could |

---

## 9. Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NF-01 | Median pitch-to-feedback latency should remain low enough to feel responsive during supported desktop play, with a target of 150 ms or less from detected note change to visible rocket/HUD response. | Must |
| NF-02 | Active gameplay should render smoothly on target desktop hardware, with a target of 55 FPS or better during normal play scenes. | Must |
| NF-03 | Audio analysis, gameplay state, rendering/UI, and persistence must be implemented as separate modules so they can be tested and replaced independently. | Must |
| NF-04 | Save data must survive browser refreshes on the same device, and invalid stored records should fail gracefully without crashing the app. | Must |
| NF-05 | The game must remain playable in the latest two Chromium-based desktop browser versions, with an optional best-effort Firefox pass. | Must |
| NF-06 | When microphone access is denied, missing, or unsupported, the game must enter a clear blocked/error state without hanging the session setup flow. | Must |
| NF-07 | Core menus and setup flows should be fully usable without requiring precision pointer input. | Should |
| NF-08 | HUD text, prompts, and stability indicators should remain readable at 1280x720 and above without overlapping critical gameplay information. | Should |

---

## 10. Security and Privacy

| ID | Requirement | Priority |
|----|-------------|----------|
| SP-01 | The game must request microphone permission explicitly through browser-native permission prompts. | Must |
| SP-02 | Audio should be processed locally in the browser for v1 and not uploaded or stored remotely. | Must |
| SP-03 | Any locally stored progress data must be limited to gameplay data such as scores, difficulty, and timestamps. | Must |
| SP-04 | The product must clearly communicate that microphone access is required for gameplay. | Must |
| SP-05 | The project should avoid collecting personally identifiable information in v1. | Must |
| SP-06 | The application must not persist raw audio buffers, voice recordings, or derived biometric-style voiceprints in local storage or any external service. | Must |
| SP-07 | Third-party telemetry, ads, or analytics SDKs that transmit microphone-related context are out of scope for v1. | Must |

The prototype handles microphone input but should not transmit or retain raw voice recordings. v1 has no account system, no cloud storage, and no regulatory compliance target beyond standard good practices for browser permissions and local data minimization. The only persisted data in scope is gameplay-oriented local state such as scores, stars, difficulty progress, and timestamps.

---

## 11. Accessibility

| ID | Requirement | Priority |
|----|-------------|----------|
| ACC-01 | Core menus should remain navigable with keyboard input. | Should |
| ACC-02 | Text and HUD elements should use readable contrast suitable for a retro theme. | Should |
| ACC-03 | Critical gameplay prompts should not rely on color alone. | Should |
| ACC-04 | The game could provide reduced-motion options if heavy screen motion is introduced. | Could |

The user selected a minimal prototype baseline, so accessibility is not a release gate at WCAG 2.1 AA level for v1. Still, basic usability and readability should be treated as part of core product quality.

---

## 12. User Interface / Interaction Design

The game should present a retro game-like experience with a strong sense of vertical journey.

Proposed screens:

- **Home Screen:** title, start button, difficulty, progress entry point.
- **Mic Check Overlay:** permission request, detected input indicator, readiness state.
- **Game Screen:** rocket, altitude progress to moon, target note prompt, hazard/boost indicators, current score/stability.
- **Results Screen:** stars, score, accuracy summary, retry, compare, return home.
- **Progress Screen:** local best runs, recent sessions, difficulty records.

Interaction principles:

- Keep the player focused on one note prompt at a time.
- Make rocket response obvious within a fraction of a second.
- Use the existing pitch bar/needle concepts only as support HUD elements, not the main gameplay metaphor.
- Favor large readable prompts over complex settings during a run.

---

## 13. System States / Lifecycle

Primary states:

1. **Idle/Home** - waiting for player action.
2. **Pre-Run Setup** - difficulty select, microphone permission, readiness check.
3. **Active Run** - note prompts, rocket simulation, score updates.
4. **Paused** - optional future state; not required for first prototype.
5. **Run Failed** - rocket lost, run ended unsuccessfully.
6. **Run Complete** - moon reached or completion target met.
7. **Results Review** - score, stars, progress save, local comparison.
8. **Blocked/Error** - microphone denied, unsupported browser, or initialization failure.

State transitions:

`Idle/Home -> Pre-Run Setup -> Active Run -> (Run Failed | Run Complete) -> Results Review -> Idle/Home`

`Pre-Run Setup -> Blocked/Error -> Idle/Home`

---

## 14. Implementation Phases

### Phase 1: Foundation and Reuse Extraction
- [ ] Audit and extract reusable pitch-detection logic from the current prototype
- [ ] Migrate from Create React App to a modern build setup
- [ ] Define shared note config, pitch windows, and game-state primitives
- [ ] Establish basic screen routing and local persistence layer

### Phase 2: Core Gameplay Prototype
- [ ] Implement microphone readiness flow
- [ ] Build active run screen with rocket movement and note prompts
- [ ] Connect pitch correctness to rocket response and scoring
- [ ] Add fail/success conditions and run summary screen

### Phase 3: Replayability and Polish
- [ ] Add difficulty levels
- [ ] Add local run comparison and progress views
- [ ] Improve retro HUD, effects, and feedback clarity
- [ ] Tune balance through playtesting

### 14.4 Component-to-Phase Traceability

| Major Component | Phase 1 Deliverables | Phase 2 Deliverables | Phase 3 Deliverables |
|----------------|----------------------|----------------------|----------------------|
| App Shell and Run Setup | New app shell, routing, start flow, permission scaffolding | Mic readiness UX, blocked/error handling, difficulty selection | UX polish and onboarding improvements |
| Audio Capture and Pitch Detection | Extract and refactor pitch pipeline, note config, audio adapter tests | Live note matching in game loop, silence/noise handling | Tuning and calibration refinements |
| Gameplay Engine and HUD | Core state model for prompts, score, rocket, hazards | Playable run loop with success/failure and HUD feedback | Difficulty tuning, effects, readability polish |
| Results, Progression, and Local Comparison | Define score/result schema | Run summary screen and save flow | Comparison screens, best-score views, progression polish |
| Shared Config and Persistence | Save schema, migration helpers, difficulty config structure | Persist results and reload state | Expand progression rules and optional unlockables |

---

## 15. Testing Strategy

| Level | Scope | Tools / Approach |
|-------|-------|------------------|
| Unit Tests | Pitch mapping, score logic, difficulty rules, persistence helpers | Vitest |
| Integration Tests | Screen flows, state transitions, permission-denied paths | React Testing Library with mocked browser APIs |
| Manual / Exploratory | Singing gameplay feel, note prompts, local comparison flow | Repeated playtesting on desktop browsers |
| Performance | Input latency and render smoothness during active runs | Browser performance tools and targeted profiling |
| Cross-Platform | Browser compatibility for prototype targets | Manual checks on latest Chrome/Edge, optional Firefox pass |

Key test scenarios:

1. Start a run with microphone permission granted.
2. Handle microphone permission denied with a clear blocked state.
3. Map detected pitch into the correct solfege note window.
4. Update rocket behavior correctly when pitch is correct, incorrect, and absent.
5. End runs correctly on failure and completion.
6. Persist and reload local progress after refresh.
7. Compare multiple local runs without corrupting stored history.
8. Verify difficulty changes affect tuning as intended.

---

## 16. Analytics / Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Playable run completion | A new player can start and finish at least one run without coaching | Manual playtesting |
| Feedback clarity | Test players can explain how singing affects the rocket after one run | Structured playtest notes |
| Replayability | Test players voluntarily attempt multiple runs in one session | Manual observation during playtests |
| Local progress retention | Scores and best runs persist across refresh on the same device | Manual validation |

No telemetry platform is planned for v1. Success should be evaluated through manual playtesting, usability observations, and whether the game loop feels more compelling than the current note-bar prototype.

---

## 17. Acceptance Criteria

### 17.1 App Shell and Run Setup

| ID | Acceptance Criteria |
|----|---------------------|
| AC-01 | A player can open the prototype, reach a home screen, and start a new run without navigating away from the app shell. |
| AC-02 | The pre-run flow requests microphone permission, reports ready/blocked state clearly, and provides a path back to the home screen if setup fails. |
| AC-03 | The player can select a difficulty before gameplay begins, and the selected difficulty is applied to the run configuration. |

### 17.2 Audio Capture and Pitch Detection

| ID | Acceptance Criteria |
|----|---------------------|
| AC-04 | Live microphone input is captured after permission is granted and does not require a page reload to begin detection. |
| AC-05 | Detected pitch is mapped to the configured solfege note windows used by gameplay prompts. |
| AC-06 | Silence, unusable input, or out-of-range pitch is represented as missing/incorrect input rather than being misclassified as a correct note. |

### 17.3 Gameplay Engine and HUD

| ID | Acceptance Criteria |
|----|---------------------|
| AC-07 | The game presents active solfege prompts during a run and updates rocket behavior based on the player’s current pitch match state. |
| AC-08 | Hazards, boosts, score progression, and rocket state all update within a single playable run loop. |
| AC-09 | The game includes both failure and success conditions, and each end state transitions cleanly to the results view. |

### 17.4 Results, Progression, and Local Comparison

| ID | Acceptance Criteria |
|----|---------------------|
| AC-10 | The results screen shows score, stars or rating, and at least one note-performance metric such as accuracy or time-on-target. |
| AC-11 | Run history persists across browser refreshes on the same device and can be read back into the progress/comparison views. |
| AC-12 | A player can compare multiple local runs on one device without requiring authentication or network access. |

### 17.5 Architecture and Delivery

| ID | Acceptance Criteria |
|----|---------------------|
| AC-13 | The rework no longer depends on Create React App as the intended long-term foundation and uses the documented modern stack instead. |

---

## 18. Dependencies and Risks

### 18.1 Dependencies

| Dependency | Type | Risk if Unavailable | Mitigation |
|------------|------|---------------------|------------|
| Browser microphone APIs | Web platform | Core gameplay cannot function | Blocked-state UX and supported-browser guidance |
| Pitch detection library | npm | Pitch accuracy or dev speed suffers | Wrap behind adapter so library can be swapped |
| Local browser storage | Web platform | Progress cannot persist | Fallback to session-only mode if storage fails |
| Modern React toolchain | npm/build | Slower migration or integration issues | Start with lightweight Vite migration and incremental feature port |

### 18.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Live pitch detection feels unreliable in noisy environments | Medium | High | Add mic check, sensitivity tuning, and playtest across varied environments |
| Gameplay is novel but not fun enough | Medium | High | Prototype quickly and playtest mechanics before adding polish |
| Legacy code reuse causes architecture drag | High | Medium | Reuse logic selectively, not the current monolithic component structure |
| Browser permission friction reduces successful starts | Medium | Medium | Add clear onboarding and recovery messaging |
| Retro visuals obscure gameplay clarity | Medium | Medium | Prioritize readable prompts and contrast during HUD design |

---

## 19. Future Considerations

| Item | Description | Potential Version |
|------|-------------|-------------------|
| Desktop packaging | Wrap the web game as a desktop app | v2 |
| Online leaderboards | Compare scores across devices | v2+ |
| Song/challenge mode | Use curated or analyzed songs as structured missions | v2+ |
| Expanded progression | Unlockables, worlds, cosmetics, campaigns | v2 |
| Accessibility expansion | Reduced motion, richer non-visual cues, fuller keyboard parity | v2 |

---

## 20. Open Questions

| # | Question | Default Assumption |
|---|----------|--------------------|
| 1 | Is local multiplayer strictly asynchronous run comparison, or should any same-screen simultaneous mode be explored later? | v1 uses asynchronous local comparison only |
| 2 | Should the player sing note names/syllables aloud, or is matching pitch by any vowel sound acceptable? | Any vocalized pitch that matches the target frequency is accepted |
| 3 | Is the first moon journey a single endless-style score attack or a short fixed mission? | Start with a single finite run structure that can be replayed |
| 4 | Should audio feedback/music be part of the MVP or postponed until core mechanics feel good? | Minimal sound effects only; no advanced music systems in v1 |
| 5 | Should advanced pitch calibration remain a hidden expert feature or a visible settings option? | Keep it optional and non-primary in the UI |

---

## 21. Glossary

| Term | Definition |
|------|------------|
| Solfege | A note naming system using syllables such as do, re, mi, fa, sol, la, and ti |
| Pitch window | The accepted frequency range for a target note |
| Run | One complete play session from start to result |
| Local comparison | Comparing multiple scores on the same device without online features |
| Mic check | A short setup step confirming microphone access and usable audio input |
