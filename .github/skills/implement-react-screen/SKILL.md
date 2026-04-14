---
name: implement-react-screen
description: >
  Create or extend a Vib'N screen using the project's routed screen structure, domain adapters,
  and accessibility requirements. Use this for Home, Game, Results, or Progress screen work.
---

# Skill: Implement a React Screen

Use this skill to build a screen that fits Vib'N's routed app shell, accessibility baseline, and domain-ownership boundaries.

---

## Process

### Step 1: Identify Screen Ownership and Inputs

1. Read the screen-related requirements in [docs/PRD.md](../../../docs/PRD.md).
2. Confirm which agent owns the screen's domain:
   - `ui-hud-developer` for Home and Game screens
   - `progression-systems-engineer` for Results and Progress screens
3. List the domain inputs required from audio, gameplay, or persistence modules before touching UI code.

### Step 2: Scaffold the Screen Module

Create the screen under the correct folder and keep layout code isolated from domain logic.

```tsx
import { memo } from 'react';

export const ExampleScreen = memo(function ExampleScreen() {
  return (
    <main aria-labelledby="screen-title">
      <h1 id="screen-title">Screen Title</h1>
    </main>
  );
});
```

### Step 3: Wire Domain State Through Typed Props or Selectors

1. Consume typed adapters from the owning feature modules.
2. Do not duplicate gameplay, audio, or persistence logic in the screen.
3. Keep keyboard flow, focus order, and contrast checks aligned with the PRD.

### Step 4: Verify and Hand Off

1. Add or update tests for routing, keyboard flow, and screen-specific states.
2. Confirm the screen satisfies the relevant requirement IDs before handoff.

---

## Reference

See [docs/PRD.md](../../../docs/PRD.md) for the full specification:

- **Section 7** — Technical architecture and screen ownership
- **Section 11** — Accessibility expectations
- **Section 12** — User interface and interaction design
- **Section 17** — Screen-related acceptance criteria
