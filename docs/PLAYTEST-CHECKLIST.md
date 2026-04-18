# Playtest Checklist — Vib'N: Rocket to the Moon

> **Purpose**: This checklist covers manual validation for requirements that are only partially automatable — game feel, visual feedback, real audio latency, cross-browser support, and accessibility.
>
> **When to use**: After all automated tests pass (`npm run test`), run through this checklist on at least one primary browser (Chrome) and one secondary browser (Firefox or Edge). Repeat after any significant gameplay, audio, or UI change.
>
> **PRD coverage**: AC-01 through AC-12, NF-01, NF-02, SP-01, SP-02, SP-04, Section 11 (Accessibility)

---

## Pre-Flight (AC-01)

- [ ] App loads at 1280×720 without layout overflow or horizontal scrollbar
- [ ] App loads at 1920×1080 without layout issues
- [ ] Home screen shows three difficulty options (Easy, Normal, Hard) with readable descriptions
- [ ] Default difficulty is selected (Easy)
- [ ] Keyboard navigation works: Tab through all interactive elements, Enter/Space to activate
- [ ] Skip-to-content link is visible on first Tab press and jumps to main content
- [ ] Focus indicators are visible on all interactive elements (focus-visible audit)
- [ ] No console errors on initial load

## Microphone Flow (AC-02, SP-04)

- [ ] "Check Mic" button is visible and accessible before any permission prompt
- [ ] Clicking "Check Mic" requests microphone permission (browser prompt appears)
- [ ] **No** microphone permission prompt appears before explicit user action
- [ ] Permission **granted** → mic readiness indicator shows positive state
- [ ] Permission **denied** → clear error/alert state displayed
- [ ] Error state message is understandable and suggests recovery (e.g., "Enable microphone in browser settings")
- [ ] After granting, "Start" button is enabled and launchable

## Gameplay — Prompts and Matching (AC-05, AC-06, AC-07)

- [ ] Prompt solfege note label is large, readable, and has retro glow styling
- [ ] Prompts cycle through the solfege sequence (Do, Re, Mi, Fa, Sol, La, Ti)
- [ ] Correct pitch input → ✓ (check) symbol displayed with green glow
- [ ] Correct pitch input → altitude increases visibly on HUD
- [ ] Incorrect pitch input → ✗ (cross) symbol displayed with pink/red glow
- [ ] Incorrect pitch input → stability decreases visibly on HUD
- [ ] Missing/silence → ⊘ (empty set) symbol displayed with blue glow
- [ ] Missing input → gradual altitude descent visible
- [ ] Prompts transition smoothly without jarring jumps

## Gameplay — Hazards and Boosts (AC-08)

- [ ] **Asteroid Drift** hazard appears during gameplay, reduces altitude and stability
- [ ] **Solar Flare** hazard appears after ~15 seconds of gameplay (not before)
- [ ] **Gravity Well** hazard appears after ~30 seconds of gameplay (not before)
- [ ] Hazard events have visible indicators/labels on HUD
- [ ] **Starlight Burst** boost appears and increases altitude
- [ ] **Nebula Shield** boost appears and recovers stability
- [ ] Boost events have visible indicators/labels on HUD
- [ ] Events feel appropriately paced (not overwhelming on Easy, not sparse on Hard)
- [ ] Easy mode: hazards feel shorter/weaker than Normal
- [ ] Hard mode: hazards feel longer/stronger than Normal
- [ ] Easy mode: boosts feel longer than Normal
- [ ] Hard mode: boosts feel shorter than Normal

## Gameplay — HUD and Visual Feedback (NF-01, NF-02)

- [ ] Rocket animation responds to pitch input within perceivable latency (<150ms feel)
- [ ] Rocket animation respects `prefers-reduced-motion` (test with OS setting or browser flag)
- [ ] HUD altitude meter has readable label and value at 1280×720
- [ ] HUD stability meter has readable label and value at 1280×720
- [ ] HUD score display updates in real-time
- [ ] Score update announcements reach screen readers (test with VoiceOver/NVDA if available)
- [ ] aria-live regions are present on dynamic content areas
- [ ] All text meets minimum contrast ratio (4.5:1 for normal, 3:1 for large text)
- [ ] Color is **not** the only indicator for match state (symbols ✓/✗/⊘ accompany colors)

## End-of-Run (AC-09, AC-10)

- [ ] "Mission Complete" screen appears when rocket reaches target altitude
- [ ] "Mission Failed" screen appears when stability depletes to zero
- [ ] Abandoning via "End run" shows abandoned results
- [ ] Results screen shows final score prominently
- [ ] Results screen shows accuracy percentage
- [ ] Results screen shows streak / timing stats
- [ ] Results screen shows star rating (0–3 stars)
- [ ] Results screen shows hazards faced and boosts caught counts

## End-of-Run — Phase 3 Features (AC-10, AC-12)

- [ ] Milestone badges display for newly earned milestones (e.g., "First Run", "Score Over 1000")
- [ ] Milestone cards have visible glow border styling
- [ ] Personal best indicator (🏆) appears when a record is broken
- [ ] Trend badge shows one of: improving ↑ / declining ↓ / stable ↔ / insufficient data
- [ ] "Play Again" or "Back to Home" navigation works from results

## Progress Screen (AC-11, AC-12)

- [ ] Progress screen is accessible via navigation
- [ ] Run history displays for the currently selected difficulty
- [ ] Each run entry shows score, outcome, and difficulty
- [ ] Per-difficulty completion rates are displayed (e.g., "60% of runs completed")
- [ ] Milestones section shows earned milestones with labels and descriptions
- [ ] Empty state (no milestones yet) shows encouraging message, not blank space
- [ ] Difficulty filter or selector works correctly
- [ ] Data persists after page refresh (close tab, reopen)

## Data Persistence (AC-03, SP-06)

- [ ] Run data appears in `localStorage` under `viben:progression` key after a completed run
- [ ] Stored data contains: score, accuracy, stars, difficulty, outcome, timestamps
- [ ] Stored data does **not** contain: audio buffers, waveforms, raw pitch arrays, recordings
- [ ] Clearing localStorage and refreshing shows empty/default state gracefully
- [ ] Corrupted localStorage (manually edit to invalid JSON) → app recovers without crash

## Privacy Verification (SP-01, SP-02)

- [ ] Open DevTools → Network tab → verify no outbound requests with audio data
- [ ] Open DevTools → Application → LocalStorage → verify no audio buffer keys
- [ ] Microphone indicator (browser tab icon) is active only during gameplay capture
- [ ] After ending a run, microphone access stops (browser mic indicator disappears)

## Cross-Browser (NF-02)

> Test the full flow (Home → Start → Game → End Run → Results → Progress) on each browser.

- [ ] **Chrome** (latest): Full flow works without errors
- [ ] **Firefox** (latest): Full flow works without errors
- [ ] **Safari** (if available, macOS/iOS): Full flow works without errors
- [ ] **Edge** (latest): Full flow works without errors
- [ ] Verify mic permission flow works on each tested browser
- [ ] Verify localStorage persistence works on each tested browser

## Performance Spot Checks (NF-01)

- [ ] No perceptible lag between singing and visual feedback update
- [ ] Frame rate stays smooth during gameplay (no visible stuttering)
- [ ] Memory usage in DevTools does not grow unboundedly during a 60+ second run
- [ ] No console warnings or errors during normal gameplay

---

## Sign-Off

| Tester | Date | Browser(s) | Result | Notes |
|--------|------|------------|--------|-------|
|        |      |            |        |       |
