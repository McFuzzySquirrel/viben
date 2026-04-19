# Feature: Mobile Support & UI Refresh

## 1. Feature Overview

**Feature Name:** Mobile Support & UI Refresh  
**Parent Document:** [docs/PRD.md](../PRD.md)  
**Status:** Draft  
**Summary:** A two-part cross-cutting feature that (1) simplifies the in-game HUD so the rocket itself conveys player performance through visual effects and animation, reduces numeric clutter, and adds contextual first-run tooltips, and (2) makes every screen responsive and touch-friendly so the game works equally well on mobile phones and tablets — including handling mobile-specific audio constraints like iOS gesture-gated AudioContext and auto-gain.  
**Scope:**  
- **Included:** HUD simplification, rocket visual feedback (flame/color/animation), responsive CSS breakpoints, touch-friendly controls, mobile audio handling (iOS gesture gate, auto-gain, background tab), contextual first-run tooltips, portrait + landscape orientation support  
- **Excluded:** Native mobile app packaging, PWA/service-worker offline mode, gamepad/controller input, redesign of non-game screens beyond responsive adaptation, new game mechanics or difficulty changes  
**Dependencies:** None — builds on the completed Phase 1–3 foundation and Voice Calibration feature

---

## 2. Context: Existing System State

**Completed PRD Phases:** All 3 phases complete (17 tasks, 209+ tests). Voice Calibration feature also implemented.  
**Relevant Existing Components:**  
- `src/screens/GameScreen/GameScreen.tsx` — Main game screen with hero section, 5 action buttons, 4 HUD meters, 4 stat cards, mic readout panel, and mission checklist panel  
- `src/screens/HomeScreen/HomeScreen.tsx` — Launch pad with difficulty selection, mic setup, 4 action buttons  
- `src/screens/ResultsScreen/` — Post-run results display  
- `src/screens/ProgressScreen/` — Local progress history  
- `src/screens/CalibrationScreen/` — Voice calibration flow  
- `src/features/game/components/RocketFlightCard.tsx` — Rocket visualization with emoji-based rocket, altitude track, and event status  
- `src/features/game/components/HudMeter.tsx` — Generic progress bar component (used 4 times on GameScreen)  
- `src/features/game/components/PromptFocusCard.tsx` — Solfege note prompt display  
- `src/features/game/components/StatusBadge.tsx` — Pill-style status indicators  
- `src/features/audio/input/session.ts` — Audio capture session with hardcoded `autoGainControl: false`  
- `src/styles/global.css` — All styling; no media queries or responsive breakpoints; fixed grid layouts (`hero` uses `grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr)`)  
- `src/shared/persistence/` — localStorage-based persistence layer  

**Existing Agents Involved:** `ui-hud-developer`, `audio-systems-engineer`, `project-architect`, `qa-test-engineer`  
**Established Conventions:** TypeScript strict mode, Vitest testing, Vite builds, localStorage-only persistence, privacy-first (no raw audio stored), `prefers-reduced-motion` CSS support, retro monospace HUD styling, CSS classes (not CSS modules), React Router 7.

---

## 3. Feature Goals and Non-Goals

### 3.1 Goals
- Simplify the GameScreen HUD so the rocket communicates player performance visually — through flame size, color shifts, shake/drift animations — reducing reliance on numeric meters
- Reduce the number of simultaneously visible HUD elements during active gameplay while keeping key numbers accessible
- Make every screen responsive from 320px mobile through 1440px+ desktop with no horizontal overflow
- Support both portrait and landscape orientations on mobile devices
- Ensure all interactive elements meet 44×44px minimum touch targets on mobile
- Handle iOS Safari's user-gesture AudioContext requirement so mobile players don't hit silent failures
- Provide contextual first-run tooltips that teach new players what HUD elements mean during their first game
- Preserve the existing retro visual identity throughout all changes
- Maintain accessibility: keyboard navigation, `prefers-reduced-motion`, contrast ratios, non-color-only feedback

### 3.2 Non-Goals
- Does not change game mechanics, scoring, difficulty tuning, or the prompt system
- Does not replace the existing PromptFocusCard — it remains the primary note display
- Does not add swipe gestures, pinch-zoom, or complex touch interactions (tap only)
- Does not create a PWA or add offline support
- Does not redesign the Results or Progress screens beyond making them responsive
- Does not change the persistence layer or data model
- Does not add new routes or screens

---

## 4. User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| FT-US-01 | Mobile Player | play the game on my phone in portrait or landscape | I don't need a desktop computer to enjoy the game | Must |
| FT-US-02 | Mobile Player | tap buttons comfortably without accidentally hitting adjacent controls | the game feels native on my phone | Must |
| FT-US-03 | Mobile Player | have microphone capture work on iOS Safari without silent failures | the game just works when I allow mic access on my iPhone | Must |
| FT-US-04 | Casual Challenger | see the rocket's flame grow, shrink, and change color based on my singing | I understand my performance at a glance without reading numbers | Must |
| FT-US-05 | Casual Challenger | see a cleaner game screen with fewer panels competing for attention | I can focus on singing and the rocket | Must |
| FT-US-06 | New Player | get brief contextual tips during my first run explaining what HUD elements mean | I learn the game naturally without reading instructions first | Should |
| FT-US-07 | Returning Player | dismiss and never see the tooltips again after my first session | the tips don't slow me down once I know the game | Should |
| FT-US-08 | Desktop Player | continue playing on desktop with the same quality experience | the mobile work doesn't degrade the desktop version | Must |

---

## 5. Technical Approach

### 5.1 Impact on Existing Architecture

**GameScreen.tsx (major refactor)**  
- Remove the "Mission checklist" panel and the "Mic and note readout" detail-list panel from the active-run view — these are setup/debug information that clutters gameplay
- Consolidate 4 HUD meters to 2 primary meters: Moon Progress and Stability. Prompt Hold becomes part of the PromptFocusCard (inline progress ring or bar). Thrust becomes a visual property of the rocket (flame size)
- Reduce the 5-button row to context-sensitive actions: during active run show only "End run" and a collapsed menu (⋯) for secondary actions
- Move the mission stats panel into a compact inline row or collapsed section during active play

**RocketFlightCard.tsx (major enhancement)**  
- Replace emoji rocket (🚀) with a styled CSS/SVG rocket element that supports:
  - Flame size scaling (small → large) based on thrust percentage
  - Color shifts: blue/green (correct), orange/red (incorrect), grey (silence)
  - Shake animation when stability is low (CSS `@keyframes` with `prefers-reduced-motion` guard)
  - Boost glow effect when a boost event is active
  - Drift animation when rocket is in "drifting" mode
- Increase the rocket track's visual prominence — it should be the dominant visual on the game screen

**HudMeter.tsx (minor modification)**  
- No structural changes; the component is reused for the 2 remaining meters
- Add a `compact` variant prop for mobile layouts

**PromptFocusCard.tsx (minor enhancement)**  
- Add an inline prompt-hold progress indicator (small arc or bar below the solfege text)
- This replaces the separate "Prompt hold" HudMeter

**global.css (major additions)**  
- Add responsive breakpoints: `@media (max-width: 768px)` for tablets, `@media (max-width: 480px)` for phones
- Convert `.hero` grid to single-column stack on mobile
- Convert `.screen-grid--game` to single-column on mobile with priority ordering (prompt card first, rocket card second, stats collapsed)
- Increase button/link minimum sizes to 44×44px on touch devices via `@media (pointer: coarse)`
- Add `.rocket-*` animation keyframes with `prefers-reduced-motion` guards
- Add `.tooltip` styles for the first-run tooltip system

**AudioInputSession (session.ts — targeted modification)**  
- Add mobile-aware AudioContext initialization: resume on user gesture for iOS Safari
- Add `autoGainControl` as a configurable constraint that defaults to `false` on desktop and `true` on mobile (mobile mics benefit from AGC)
- Add a `resumeOnGesture()` utility that attaches a one-time `touchstart`/`click` listener to resume a suspended AudioContext

**New: src/shared/hooks/useFirstRunTooltips.ts**  
- Hook that tracks which tooltip groups the player has seen via localStorage key `viben:tooltips-seen`
- Returns `{ shouldShow(groupId): boolean, dismiss(groupId): void, dismissAll(): void }`
- Groups: `'hud-meters'`, `'rocket-feedback'`, `'prompt-card'`, `'controls'`

**New: src/shared/components/Tooltip.tsx**  
- Lightweight positioned tooltip component
- Props: `targetRef`, `content`, `position` (`top`|`bottom`|`left`|`right`), `visible`, `onDismiss`
- Uses CSS positioning relative to parent, no third-party library

**New: src/shared/hooks/useViewport.ts**  
- Lightweight hook that exposes `{ isMobile, isTablet, isDesktop, isPortrait, isLandscape }`
- Uses `matchMedia` listeners, not `resize` events
- Breakpoints: mobile ≤480px, tablet ≤768px, desktop >768px

### 5.2 New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Tooltip` | `src/shared/components/Tooltip.tsx` | Contextual first-run tooltip |
| `useFirstRunTooltips` | `src/shared/hooks/useFirstRunTooltips.ts` | First-run state tracking |
| `useViewport` | `src/shared/hooks/useViewport.ts` | Responsive viewport detection |
| `RocketSprite` | `src/features/game/components/RocketSprite.tsx` | CSS/SVG rocket with visual feedback states |

### 5.3 Technology Additions

None. This feature uses only existing technologies (React 19, TypeScript, CSS, Web Audio API, localStorage). No new npm dependencies required.

---

## 6. Functional Requirements

| ID | Requirement | Affects Existing | Priority |
|----|-------------|-----------------|----------|
| FT-FR-01 | The game screen must display no more than 2 HUD meter bars during active gameplay (Moon Progress, Stability) | Yes — GameScreen.tsx removes Thrust and Prompt Hold meters | Must |
| FT-FR-02 | Prompt hold progress must be displayed inline within the PromptFocusCard rather than as a separate meter | Yes — PromptFocusCard.tsx gains inline progress | Must |
| FT-FR-03 | Engine thrust must be communicated through rocket flame size and intensity rather than a numeric meter | Yes — RocketFlightCard.tsx enhanced with visual thrust | Must |
| FT-FR-04 | The rocket visualization must change appearance based on flight mode: steady (blue glow), boosting (green/bright), drifting (orange, slight wobble), critical (red, shake), offline (grey, no flame) | Yes — RocketFlightCard.tsx | Must |
| FT-FR-05 | During active gameplay, only contextually relevant action buttons should be visible (End Run primary; secondary actions collapsed or hidden) | Yes — GameScreen.tsx | Should |
| FT-FR-06 | The Mission Checklist and Mic/Note Readout panels must be hidden during active gameplay and only shown in the pre-run or post-run states | Yes — GameScreen.tsx | Should |
| FT-FR-07 | All screens must render without horizontal overflow on viewports from 320px to 1440px+ wide | Yes — global.css, all screen components | Must |
| FT-FR-08 | Grid layouts (hero, screen-grid, metric-grid) must stack to single-column on viewports ≤768px | Yes — global.css | Must |
| FT-FR-09 | All interactive elements must have a minimum touch target of 44×44 CSS pixels on devices with coarse pointers | Yes — global.css button/link rules | Must |
| FT-FR-10 | The AudioContext must be created or resumed on a user gesture (tap/click) to support iOS Safari and other browsers that require gesture-gated audio | Yes — session.ts | Must |
| FT-FR-11 | On mobile devices, `autoGainControl` should default to `true` in the audio capture constraints | Yes — session.ts | Should |
| FT-FR-12 | First-time players must see contextual tooltips on key HUD elements during their first game run | No — new Tooltip component | Should |
| FT-FR-13 | Tooltips must be dismissible by tapping/clicking them and must not reappear after dismissal | No — new persistence key | Should |
| FT-FR-14 | The game screen must support both portrait and landscape orientations on mobile without layout breakage | Yes — global.css, GameScreen.tsx | Must |

---

## 7. Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FT-NF-01 | Responsive layout changes must not degrade the existing NF-02 target of 55 FPS during active gameplay | Must |
| FT-NF-02 | Rocket animations must respect `prefers-reduced-motion: reduce` by disabling shake, wobble, and flame flicker effects | Must |
| FT-NF-03 | The tooltip system must not interfere with the NF-01 pitch-to-feedback latency budget of 150ms | Must |
| FT-NF-04 | Touch target sizing must coexist with keyboard focus styling — focus-visible outlines must remain functional | Must |
| FT-NF-05 | The new `viben:tooltips-seen` localStorage key must follow the same versioning and recovery conventions as existing persistence keys | Should |
| FT-NF-06 | CSS additions should remain in `global.css` following the established single-file convention, organized with clear section comments | Should |

---

## 8. Agent Impact Assessment

### 8.1 Existing Agents — Extended Responsibilities

| Agent | New Responsibilities | Modified Boundaries |
|-------|---------------------|-------------------|
| `ui-hud-developer` | Owns all HUD simplification, rocket visual feedback, responsive layout, touch-target sizing, tooltip components, and first-run UX. This is the primary owner of this feature. | Boundary expands to include responsive/mobile layout concerns and the tooltip system |
| `audio-systems-engineer` | Owns mobile audio handling: iOS gesture-gated AudioContext, mobile auto-gain defaults, and background-tab suspension recovery | Boundary expands to include mobile-specific audio platform quirks |
| `project-architect` | Owns the responsive breakpoint strategy and `useViewport` hook as shared infrastructure | Minor expansion — viewport detection is shared infrastructure |
| `qa-test-engineer` | Owns test coverage for responsive breakpoints, tooltip persistence, mobile audio gesture handling, and cross-device testing | Testing scope expands to include mobile simulation tests |

### 8.2 New Agents Required

None — the existing agent team covers all domains. `ui-hud-developer` is the primary owner with `audio-systems-engineer` handling mobile audio.

### 8.3 Existing Agents — No Changes

| Agent | Reason |
|-------|--------|
| `gameplay-systems-engineer` | Game mechanics, scoring, prompts, hazards, and run loop are untouched |
| `progression-systems-engineer` | Persistence model, progression logic, and results computation are untouched |
| `forge-team-builder` | Infrastructure agent, not involved in feature work |
| `project-orchestrator` | Orchestration agent, not involved in feature implementation |

---

## 9. Implementation Phases

### Phase F1: HUD Simplification & Rocket Visual Feedback
- [ ] Create `RocketSprite` component with CSS/SVG rocket supporting flame size, color, shake, and glow states
- [ ] Update `RocketFlightCard` to use `RocketSprite` instead of emoji, passing thrust/mode/event data as visual props
- [ ] Add inline prompt-hold progress indicator to `PromptFocusCard`
- [ ] Remove Thrust and Prompt Hold `HudMeter` instances from `GameScreen`
- [ ] Conditionally hide Mission Checklist and Mic Readout panels during active gameplay
- [ ] Consolidate action buttons to show only contextually relevant actions during active runs
- [ ] Add rocket animation keyframes to `global.css` with `prefers-reduced-motion` guards
- [ ] Update existing tests for modified component props and removed elements

### Phase F2: Responsive Layout & Touch Support
- [ ] Add responsive CSS breakpoints to `global.css` (768px tablet, 480px phone)
- [ ] Convert `.hero` grid to single-column stack on mobile
- [ ] Convert `.screen-grid`, `.metric-grid`, `.run-stat-grid` to responsive single-column on mobile
- [ ] Implement `@media (pointer: coarse)` rules for 44×44px minimum touch targets
- [ ] Create `useViewport` hook with `matchMedia`-based breakpoint detection
- [ ] Ensure portrait and landscape work on all game screens
- [ ] Adjust `.rocket-track` min-height and proportions for mobile viewports
- [ ] Test all screens at 320px, 480px, 768px, 1024px, and 1440px widths

### Phase F3: Mobile Audio Handling
- [ ] Add `resumeOnGesture()` utility to `session.ts` for iOS Safari AudioContext gesture gate
- [ ] Integrate gesture-based AudioContext resume into the mic readiness flow
- [ ] Make `autoGainControl` configurable with mobile-aware defaults
- [ ] Add background-tab recovery: detect `visibilitychange` and re-resume AudioContext when tab becomes visible
- [ ] Update the "unsupported" and "blocked" guidance copy to include mobile-specific instructions
- [ ] Test on iOS Safari (or Safari simulator) and Chrome Android

### Phase F4: First-Run Contextual Tooltips
- [ ] Create `Tooltip` component with positioning logic (no external deps)
- [ ] Create `useFirstRunTooltips` hook with localStorage persistence (`viben:tooltips-seen`)
- [ ] Add tooltip triggers to key GameScreen elements: Moon Progress meter, Stability meter, PromptFocusCard, RocketSprite
- [ ] Add a "Got it" dismiss interaction on each tooltip
- [ ] Add a "Skip all tips" option for impatient players
- [ ] Ensure tooltips don't obscure critical gameplay elements on mobile viewports
- [ ] Add tooltip CSS to `global.css`

---

## 10. Testing Strategy

| Level | Scope | Approach |
|-------|-------|----------|
| Unit Tests | RocketSprite visual state mapping, useViewport breakpoint logic, useFirstRunTooltips persistence, audio gesture utility | Vitest with mocked matchMedia and localStorage |
| Integration Tests | GameScreen rendering with simplified HUD, conditional panel visibility, tooltip flow, responsive layout class application | React Testing Library with viewport simulation |
| Regression Tests | Existing GameScreen behavior (run start/stop, results navigation), HudMeter component, PromptFocusCard, audio session creation | Existing test suite must continue passing |
| Visual / Manual | Responsive layouts at key breakpoints, rocket animation smoothness, touch target sizes on real devices, iOS Safari audio flow | Manual testing on Chrome DevTools device mode + real iOS/Android devices |
| Performance | FPS during active gameplay with new rocket animations, layout reflow cost of responsive changes | Browser DevTools performance profiling |

Key test scenarios:

1. GameScreen shows exactly 2 HUD meters during an active run (Moon Progress, Stability)
2. RocketSprite displays correct visual state for each flight mode (steady, boosting, drifting, critical, offline)
3. Rocket flame size scales proportionally to thrust percentage
4. PromptFocusCard shows inline prompt-hold progress
5. Mission Checklist and Mic Readout panels are hidden during active gameplay, visible before/after
6. All screens render without horizontal overflow at 320px width
7. Interactive elements measure ≥44×44px on coarse-pointer devices
8. AudioContext resumes after user gesture on iOS Safari
9. First-run tooltips appear on first game, persist dismissal in localStorage, do not reappear
10. `prefers-reduced-motion: reduce` disables rocket shake/wobble/flicker animations
11. Desktop gameplay experience is unchanged (no regression in layout or functionality)

---

## 11. Rollback Considerations

**Modified files:**
- `src/screens/GameScreen/GameScreen.tsx` — HUD simplification and conditional panels (git revert restores 4 meters + all panels)
- `src/features/game/components/RocketFlightCard.tsx` — RocketSprite integration (revert restores emoji rocket)
- `src/features/game/components/PromptFocusCard.tsx` — Inline progress (revert removes it)
- `src/features/audio/input/session.ts` — Mobile audio constraints (revert restores desktop-only defaults)
- `src/styles/global.css` — Responsive breakpoints and rocket animations (revert removes all new CSS sections)

**New files (safe to delete):**
- `src/shared/components/Tooltip.tsx`
- `src/shared/hooks/useFirstRunTooltips.ts`
- `src/shared/hooks/useViewport.ts`
- `src/features/game/components/RocketSprite.tsx`
- All new test files for the above

**Data considerations:**
- New localStorage key `viben:tooltips-seen` — harmless if left behind after rollback; the app will ignore unknown keys
- No database migrations or schema changes

**Regression verification:**
- Existing test suite validates original behavior after revert
- Manual check: GameScreen shows 4 HUD meters, emoji rocket, all panels visible, no responsive breakpoints

---

## 12. Acceptance Criteria

1. During an active game run, the GameScreen displays exactly 2 HUD meter bars (Moon Progress and Stability) — Thrust and Prompt Hold are conveyed visually through the rocket and prompt card respectively.
2. The rocket visualization changes flame size based on thrust, shifts color based on match state (correct/incorrect/silence), and animates shake/drift based on stability and flight mode.
3. All rocket animations are disabled when `prefers-reduced-motion: reduce` is active.
4. The Mission Checklist panel and Mic/Note Readout panel are hidden during active gameplay.
5. Only contextually relevant action buttons are visible during active gameplay.
6. Every screen in the app renders without horizontal overflow at viewport widths from 320px to 1440px+.
7. Grid-based layouts (hero, screen-grid, metric-grid) collapse to single-column on viewports ≤768px.
8. All buttons, links, and interactive elements have a minimum 44×44px touch target on coarse-pointer devices.
9. Both portrait and landscape orientations produce usable layouts on mobile viewports.
10. Microphone capture initializes successfully on iOS Safari when the player taps the Start button (AudioContext resumes on user gesture).
11. On mobile devices, `autoGainControl` defaults to `true` in audio capture constraints.
12. First-time players see contextual tooltips on key HUD elements during their first game run.
13. Tooltips are dismissible and do not reappear after dismissal (state persisted in localStorage).
14. The desktop gameplay experience shows no functional or visual regression compared to the pre-feature state.
15. All existing tests continue to pass without modification (unless tests explicitly assert removed elements).

---

## 13. Open Questions

| # | Question | Default Assumption |
|---|----------|--------------------|
| 1 | Should the simplified HUD have an "expand" toggle for players who want to see all 4 meters? | No — the moderate simplification removes Thrust and Prompt Hold as separate meters but keeps their data visible through rocket visuals and inline prompt progress. If players request it, a future iteration can add an expand toggle. |
| 2 | Should the RocketSprite be pure CSS or use inline SVG? | Use inline SVG for the rocket shape with CSS animations for flame/glow/shake — this gives the best balance of visual quality and animation performance. |
| 3 | How many tooltips should appear during the first run — all at once or sequenced? | Sequenced: show one tooltip at a time, advancing to the next when the current one is dismissed. Start with the prompt card tooltip, then stability, then rocket, then moon progress. |
| 4 | Should mobile auto-gain be detectable automatically or require a user setting? | Auto-detect via `navigator.userAgent` or `navigator.maxTouchPoints > 0` — no user-facing setting needed. |
| 5 | Should the background-tab AudioContext recovery show a visual indicator that audio was interrupted? | Yes — show a brief "Audio resumed" toast or inline-message when the AudioContext recovers from a suspended state. |
