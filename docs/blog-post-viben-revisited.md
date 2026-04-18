---
layout: post
title:  "Revisiting Vib'N: From a Pitch Experiment to a Rocket Game, 17 Months Later"
date:   2026-04-18 20:00:00 +0200
categories: [personal, project]
tags: [agent forge, game development, voice, AI orchestration, revisiting projects]
---

> *A forgotten pitch-matching experiment, a kid's question about rockets, and a framework I'd been itching to test on something real — this is the story of what happened when all three collided.*

Seventeen months. That's how long a little React app called Vib'N sat untouched in a repo before my son asked the question that changed everything: *"Dad, what happened to that old voice thing you built? Can we change it into a rocket game?"*

This is the story of revisiting that repo, what I found, what I built with [Agent Forge](https://mcfuzzysquirrel.github.io/personal/update/2026/03/20/story-of-agent-forge.html), and what I learned about the gap between "technically correct" and "actually playable."

---

## Table of Contents

- [The Original: A Hackathon Challenge (November 2024)](#the-original-a-hackathon-challenge-november-2024)
- [The Question That Changed Everything](#the-question-that-changed-everything)
- [Bringing Agent Forge to a Real Project](#bringing-agent-forge-to-a-real-project)
- [What Got Built: Vib'N Rocket to the Moon](#what-got-built-vibn-rocket-to-the-moon)
- [The Human in the Loop: Iterating After Launch](#the-human-in-the-loop-iterating-after-launch)
- [By the Numbers](#by-the-numbers)
- [What I'd Do Next](#what-id-do-next)
- [The Takeaway](#the-takeaway)

---

## The Original: A Hackathon Challenge (November 2024)

It started with a challenge. I was hosting a hackathon, and someone threw down the gauntlet: *"Can you build an app that helps people sing, in an afternoon?"*

This was November 2024. AI-assisted coding was still in its early days — useful, but nowhere near what it is today. We took the challenge anyway and built **Vib'N**: a simple React app that listened to your microphone, detected pitch using the YIN algorithm, and matched your voice to solfege notes (Do, Re, Mi, Fa, Sol, La, Ti). It showed a circular pitch needle, colored bars for each note, and let you adjust frequency ranges manually.

It was rough, it was fun, and it proved the concept. We got something working in an afternoon. That alone felt like a win.

Here's what that looked like — the landing page and the active pitch detection view:

![Original Vib'N — Landing Page](/assets/images/2026-04-18-viben-revisited/00-original-app.png)

![Original Vib'N — Active Pitch Detection](/assets/images/2026-04-18-viben-revisited/00-original-active.png)

A circular pitch needle, colored note bars (Do through Ti), frequency ranges displayed in the corner, and a "Choose File" upload that never quite worked. Simple, functional, honest.

**The original tech stack:**
- React 17 with Create React App
- The `pitchfinder` library for pitch detection
- 8 components, ~1,000 lines of TypeScript
- No routing, no game logic, no persistence
- A pitch needle, some colored bars, and a file upload feature that never quite worked

It did one thing: listen to your voice and tell you which note you were singing. That was it. It worked, mostly, and then life moved on. The repo sat untouched for over a year.

But looking back, that hackathon moment is what makes the rest of this story interesting. The same challenge — "can you build something with voice in an afternoon?" — asked today, with the tools and skills I've picked up since, produces a dramatically different answer.

---

## The Question That Changed Everything

Fast forward to April 2026. My son, who'd seen me tinkering with the original, asked the question that sparked everything:

> *"What happened to that old voice thing you built? Can we change it into a rocket game?"*

A rocket game. Powered by singing. The idea was immediately compelling: keep the core mechanic (sing a note, get feedback) but wrap it in something that feels like a *game*. A rocket that climbs when you hit the right notes. Hazards when you miss. A score. A reason to try again.

But I also had something I didn't have 17 months ago: **[Agent Forge](https://mcfuzzysquirrel.github.io/personal/update/2026/03/20/story-of-agent-forge.html)** — the framework I built for turning ideas into coordinated AI development teams. This was the perfect test case. Not a toy demo, but a real project with audio constraints, browser APIs, game logic, and accessibility requirements.

Could a team of AI specialists, orchestrated through a PRD, actually rebuild this thing into a real game?

---

## Bringing Agent Forge to a Real Project

### Step 1: The PRD

Following the Agent Forge workflow, the first step wasn't code. It was requirements.

I sat down with the `forge-build-prd` skill and described the vision: a retro-inspired singing game where solfege notes control a rocket. The PRD interview process asked the right questions — who's the player, what's the core loop, what are the non-functional requirements, how does difficulty scale, what about accessibility?

The output was a structured PRD covering everything: personas, user stories, 52 traceable requirements, implementation phases, and acceptance criteria. The PRD became the single source of truth that every agent would reference.

### Step 2: The Agent Team

The `forge-build-agent-team` skill analyzed the PRD and generated **8 specialist agents**:

| Agent | Domain |
|-------|--------|
| **Project Architect** | Vite migration, routing, shared types, app shell |
| **Audio Systems Engineer** | Microphone capture, pitch detection, Web Audio API |
| **Gameplay Systems Engineer** | Game loop, rocket physics, hazards, boosts, prompts |
| **UI/HUD Developer** | Screens, HUD components, accessibility |
| **Progression Systems Engineer** | Difficulty, persistence, results, milestones |
| **QA Test Engineer** | Unit, integration, and acceptance tests |
| **Project Orchestrator** | Phase coordination and dependency management |
| **Forge Team Builder** | Agent team generation and evolution |

Plus **8 reusable skills** — structured processes for building audio flows, game state modules, React screens, test suites, and more.

Every one of the 52 PRD requirements was mapped to exactly one owning agent. No gaps, no overlaps. The orchestrator knew the dependency graph: the architect goes first, then audio, then gameplay, and so on.

### Step 3: Phased Execution

The project orchestrator coordinated the build across three phases:

**Phase 1 — Foundation:** The project architect migrated from Create React App to Vite, set up React Router, established the shared type system, and created shell screens for all five routes.

**Phase 2 — Core Systems:** The audio engineer built real-time pitch detection. The gameplay engineer wired it into a run loop with rocket physics, hazards, and boosts. The UI developer built the HUD. The progression engineer added scoring and persistence.

**Phase 3 — Polish:** Difficulty tuning, calibration presets, milestone detection, retro styling, and full acceptance testing.

Each agent worked within its defined boundaries, verified its work with typecheck/test/build, and handed off to the next. The orchestrator tracked progress and ensured prerequisites were met before each phase.

---

## What Got Built: Vib'N Rocket to the Moon

Here's what a run through the game looks like today:

### Home — The Launch Pad

![Home Screen](/assets/images/2026-04-18-viben-revisited/01-home.png)

Pick your difficulty, check your stats, and launch a mission. The retro-styled interface shows your best scores, active difficulty, and voice profile status.

### Game — Active Mission

![Game Screen](/assets/images/2026-04-18-viben-revisited/02-game.png)

The core experience. A solfege note appears ("Sing: Do"), you sing it, and the rocket responds. Hit the note accurately and the rocket climbs. Miss it and your stability drops. The HUD shows stability, thrust, altitude, accuracy, and the current prompt — all in a retro monospace style.

Three hazards appear during the run to keep things interesting:
- **Asteroid Drift** — pushes you off course
- **Solar Flare** — drains fuel faster
- **Gravity Well** — pulls the rocket down

Two boosts reward accuracy:
- **Starlight Burst** — altitude jump
- **Nebula Shield** — temporary damage protection

### Voice Calibration

![Calibration Screen](/assets/images/2026-04-18-viben-revisited/03-calibration.png)

This is where accessibility meets gameplay. Not everyone's voice fits standard solfege frequency ranges. The calibration screen lets you record your own Do, Re, Mi — capturing your actual vocal range. The game then builds custom frequency windows from your voice, so you're playing with *your* notes, not textbook frequencies.

### Results — Run Review

![Results Screen](/assets/images/2026-04-18-viben-revisited/04-results.png)

After each run: altitude reached, accuracy percentage, notes hit vs missed, stars earned. Clean breakdown of what worked and what didn't.

### Progress — History & Milestones

![Progress Screen](/assets/images/2026-04-18-viben-revisited/05-progress.png)

Your run history, personal bests, milestones unlocked, and trend tracking across sessions. All stored locally — no accounts, no cloud, just your browser.

---

## The Human in the Loop: Iterating After Launch

Here's the part that surprised me most. The agents built a working game. But *playing* the game revealed problems that no PRD could predict.

### "Easy Mode Is Too Hard"

The first time I tried Easy difficulty, I couldn't complete a run. The note windows were too narrow for my voice, and the microphone was picking up every ambient sound. The agents had built technically correct solfege ranges, but they'd never *sung* into the app.

**Fix:** Wider cents tolerance (Easy now gives ±65 cents, up from ±45 on Normal), a higher noise floor threshold, and difficulty-specific overrides that make the game genuinely forgiving for beginners.

### "Classification Out of Range"

During voice calibration, singing "Do" in my natural register threw an error — the system expected notes within standard solfege ranges and rejected anything outside them. But that's the whole point of calibration: capturing *your* range, even if it doesn't match the textbook.

**Fix:** Changed the capture filter to accept any frequency with a valid pitch reading, not just frequencies that already match a known note classification.

### "The Game Doesn't Use My Calibrated Voice"

After recording a voice profile, I started a game and... it used standard frequencies. The calibrated ranges were saved but never threaded into the gameplay pipeline. Three separate issues: window expansion was ignoring the captured range, the classifier was ambiguous on boundary notes, and accuracy calculations used the wrong reference windows.

**Fix:** Expanded windows using geometric midpoint clipping, a nearest-window classifier for ambiguous pitches, and proper threading of custom windows through the entire pitch target snapshot.

### "I Run Out of Breath"

The game prompts notes back to back with no pause. After 30 seconds, you're gasping. This is a singing game — players need to breathe.

**Fix:** Added a configurable breathing gap between notes. During the gap, the game shows "Breathe..." with a countdown, physics stay neutral, and no metrics are recorded. Easy gets 900ms between notes, Normal 600ms, Hard just 350ms.

Every one of these fixes was something I discovered by *being the player*. The AI agents built the system correctly according to spec. But the spec didn't know what it feels like to sing into a laptop microphone with an imperfect voice in a quiet room that isn't actually quiet.

**This is the human-in-the-loop pattern that I think matters most:** AI builds the system, human tests the experience, human feeds back, AI iterates. Not human vs AI — human *with* AI, each doing what they're good at.

---

## By the Numbers

A quick comparison of where this project started and where it is now:

| Metric | Original (Nov 2024) | Current (Apr 2026) |
|--------|---------------------|-------------------|
| **Source files** | 11 | 104 |
| **Lines of TypeScript/CSS** | ~1,000 | ~13,300 |
| **Components/modules** | 8 | 50+ |
| **Tests** | 0 | 266 |
| **Screens** | 1 | 5 |
| **Build tool** | Create React App | Vite |
| **Game mechanics** | None | Full run loop, hazards, boosts, breathing |
| **Persistence** | None | Local storage with versioned save format |
| **Voice calibration** | None | Full capture-and-play custom frequency system |
| **Difficulty levels** | None | 3 (Easy, Medium, Hard) |
| **AI agents involved** | 0 | 8 |
| **Time from PRD to playable** | N/A | ~1 day |

The original was a proof of concept. The rework is a game.

---

## What I'd Do Next

This is a working prototype, not a finished product. Here's what's on my mind:

### Mobile Support
The game currently targets desktop browsers. But singing games are inherently mobile — you're already holding your phone near your face. Touch-friendly controls, responsive layout, and mobile audio handling would make this much more accessible.

### A Cleaner, More Focused UI
The current UI works but tries to show everything at once. I'd like to simplify: fewer numbers on the HUD, more visual feedback (the rocket itself telling you how you're doing), and a more guided first-time experience.

### Better Onboarding
Right now, you land on the home screen and need to figure out what to do. A brief interactive tutorial — "Sing Do to launch the rocket" — would make the first 30 seconds much clearer.

### Sound Design
The game is currently silent except for your voice. Adding launch sounds, boost effects, and ambient space audio would transform the experience. The irony of a music game with no music isn't lost on me.

### Multiplayer Comparisons
Local multiplayer is in the PRD but unimplemented. Two players, same device, trading turns and comparing scores. My son would love this.

---

## The Takeaway

Two things stand out from this project:

**1. Old projects are seeds, not failures.** That weekend experiment in 2024 wasn't abandoned — it was waiting. The core mechanic (browser pitch detection) was solid. It just needed a purpose. Sometimes the best thing you can do for a project is walk away and come back with fresh eyes and better tools.

**2. Agent Forge works on real projects.** This wasn't a demo or a tutorial app. It had browser APIs, real-time audio processing, game physics, accessibility requirements, and the kind of edge cases you only find by playing. Eight agents, coordinated through a PRD, built a playable game. The human still needed to be in the loop — testing, feeding back, iterating — but the agents handled the heavy lifting of structured implementation.

My son hasn't beaten Hard mode yet. Neither have I. But the rocket flies, and that's a start.

---

*The source code is at [github.com/McFuzzySquirrel/viben](https://github.com/McFuzzySquirrel/viben). The original prototype lives on the [`main` branch](https://github.com/McFuzzySquirrel/viben/tree/main). The rework is on [`feat/rework-rocket`](https://github.com/McFuzzySquirrel/viben/tree/feat/rework-rocket).*

*Agent Forge is documented in [The Story of Agent Forge](https://mcfuzzysquirrel.github.io/personal/update/2026/03/20/story-of-agent-forge.html).*
