<div align="center">
  <img src="viben-logo.png" width="128" alt="Vib'N logo">

  # Vib'N: Rocket to the Moon

  *A retro singing game where your voice powers a rocket to the moon*

  ![Node.js](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)
  ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square)
  ![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
  ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

  [Features](#features) • [Walkthrough](#walkthrough) • [Getting Started](#getting-started) • [How to Play](#how-to-play) • [Architecture](#architecture) • [Tech Stack](#tech-stack)

</div>

Vib'N turns solfege note matching into an arcade-style rocket flight challenge. Sing **do, re, mi, fa, sol, la, ti** into your microphone to keep a rocket stable, dodge hazards, collect boosts, and reach the moon. Real-time browser pitch detection powers the entire experience — no server, no uploads, no accounts.

## Features

- **Real-time pitch detection** — Browser-based microphone analysis with sub-150ms latency using the Web Audio API and `pitchfinder`
- **Solfege gameplay** — Match prompted notes (do through ti) to control your rocket's altitude and stability
- **Dynamic hazards and boosts** — Asteroid Drift, Solar Flare, Gravity Well, Starlight Burst, and Nebula Shield keep every run different
- **Three difficulty levels** — Easy, Normal, and Hard with scaled note windows, prompt cadence, and event intensity
- **Calibration presets** — Default, Sensitive, and Strict tuning profiles for different skill levels and environments
- **Local progression** — Run history, personal bests, completion rates, trends, and 12 earnable milestones stored in `localStorage`
- **Retro arcade HUD** — Monospace styling, glow effects, and smooth rocket animations with `prefers-reduced-motion` support
- **Accessible by default** — Keyboard navigation, skip links, `aria-live` regions, WCAG AA contrast, and match indicators that don't rely on color alone
- **Privacy-first** — All audio is processed locally and discarded. Only derived gameplay metrics are stored. No accounts, no cloud, no telemetry

## Walkthrough

### Home — Launch Pad

The home screen uses tabbed panels to separate setup and difficulty selection, keeping each concern focused on both mobile and desktop.

**Setup tab** — Check your microphone status, view keyboard tips, and launch a singing run.

![Home screen — Setup tab with mic check and launch](docs/screenshots/01-home-setup.png)

**Difficulty tab** — Pick Easy, Normal, or Hard. Your choice persists locally for next time.

![Home screen — Difficulty tab with card selection](docs/screenshots/01b-home-difficulty.png)

### Game — Active Mission

The game HUD shows the current solfege prompt, rocket altitude, stability meters, and live mic readout. During an active run, secondary panels are hidden so the player can focus on singing without scrolling.

![Game screen — HUD with prompt, rocket, and meters](docs/screenshots/02-game.png)

### Voice Calibration

Teach the game your singing range one note at a time. Sing each solfege note (Do through Ti) and hold it steady. The game records your natural frequencies to build a personalised voice profile.

![Calibration screen — capture your voice range](docs/screenshots/03-calibration.png)

### Results — Run Review

After each run, review your score, milestones, and comparison against previous attempts across two tabs.

**Summary tab** — Outcome, score, star rating, accuracy, and any new milestones or personal bests.

![Results screen — Summary tab with score and milestones](docs/screenshots/04-results-summary.png)

**Details tab** — Run breakdown, prompts cleared, hazards, and best-on-difficulty comparison.

![Results screen — Details tab with run breakdown](docs/screenshots/04b-results-details.png)

### Progress — History & Milestones

Track your full run history across three tabs. All data stays local in the browser.

**Overview tab** — Metric cards, recent runs list, and save recovery status.

![Progress screen — Overview tab with metrics and recent runs](docs/screenshots/05-progress-overview.png)

**Comparison tab** — Same-device comparison showing score, accuracy, and time deltas between runs.

![Progress screen — Comparison tab with run deltas](docs/screenshots/05b-progress-comparison.png)

**Records tab** — Difficulty records, completion rates, trends, and earned milestones.

![Progress screen — Records tab with milestones and difficulty records](docs/screenshots/05c-progress-records.png)

### Mobile Views

All screens adapt to narrow viewports with single-column layouts, scrollable tab bars, and touch-friendly 44px minimum targets.

| Home (Setup) | Home (Difficulty) | Game |
|:---:|:---:|:---:|
| ![Home mobile](docs/screenshots/06-home-mobile.png) | ![Home difficulty mobile](docs/screenshots/06b-home-difficulty-mobile.png) | ![Game mobile](docs/screenshots/07-game-mobile.png) |

| Calibration | Results | Progress |
|:---:|:---:|:---:|
| ![Calibration mobile](docs/screenshots/08-calibration-mobile.png) | ![Results mobile](docs/screenshots/09-results-mobile.png) | ![Progress mobile](docs/screenshots/10-progress-mobile.png) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20.19 or later
- A browser with microphone support (Chrome, Edge, or Firefox recommended)

### Installation

```bash
git clone https://github.com/McFuzzySquirrel/viben.git
cd viben
npm install
```

### Development

```bash
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:5173`).

### Build and preview

```bash
npm run build
npm run preview
```

### Verify

```bash
npm run typecheck    # Type-check with TypeScript
npm run test         # Run the full test suite (321 tests)
npm run build        # Production build
```

## How to Play

1. **Choose difficulty** — Pick Easy, Normal, or Hard on the home screen
2. **Grant mic access** — Click "Check Mic" and allow browser microphone permission
3. **Launch** — Hit the launch button to start your run
4. **Sing the note** — A solfege prompt appears (e.g. "Do", "Re", "Mi") — sing it to climb
5. **Stay stable** — Correct pitch boosts your rocket; wrong notes or silence cause drift and stability loss
6. **Survive events** — Dodge hazards and ride boosts as they appear throughout the run
7. **Reach the moon** — Hit the target altitude to complete the mission, or lose all stability to fail
8. **Review results** — See your score, accuracy, milestones earned, and personal bests

> [!TIP]
> Start on **Easy** difficulty to get comfortable with the mic setup and note matching before moving up.

## Architecture

The project uses a feature-based module structure:

```
src/
  app/              # Router, providers, shell
  features/
    audio/          # Microphone input, pitch detection, classification
    game/
      engine/       # Simulation, prompts, hazards, tuning (pure functions)
      state/        # Reducer, selectors, run controller
      components/   # HUD — meters, prompt card, rocket, status badge
    progression/    # Milestones, selectors, run history
    settings/       # Difficulty selection state
  screens/          # Home, Game, Results, Progress, NotFound
  shared/
    config/         # Solfege windows, difficulty definitions, privacy
    persistence/    # localStorage adapter with schema versioning
  styles/           # Global CSS with retro dark theme
```

Key design decisions:

- **Deterministic gameplay engine** — All simulation logic is pure functions, making it fully testable without browser APIs
- **Feature isolation** — Audio, game, and progression modules communicate through typed contracts, not direct imports
- **Privacy by architecture** — Audio buffers are never stored; only pitch classification results flow out of the audio module

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, React Router 7 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Pitch Detection | pitchfinder + Web Audio API |
| Testing | Vitest + React Testing Library |
| Persistence | localStorage (structured, versioned) |
| Styling | CSS with custom properties (no framework) |

## Project History

Vib'N started during a hackathon in 2023 with a challenge: *"Can you build an app that helps people sing, in an afternoon?"* The original prototype used Create React App with a simple pitch needle and frequency bars. After a playtest session in 2024, the idea evolved into a rocket-themed singing game.

In April 2026, the project was rebuilt from scratch using [McFuzzy Agent Forge](https://github.com/McFuzzySquirrel/mcfuzzy-agent-forge) — 8 specialist AI agents working across 3 implementation phases to deliver 266 tests and a complete game experience.

- 📖 **[Read the full story](docs/blog-post-viben-revisited.md)** — A blog post about revisiting the project after 17 months
- 🗂️ **[Original code](https://github.com/McFuzzySquirrel/viben/tree/archive/the-original-viben)** — The hackathon prototype lives on the `archive/the-original-viben` branch
