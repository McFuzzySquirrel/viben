---
name: create-game-state-module
description: >
  Create a typed Vib'N state or rules module for gameplay, progression, or shared configuration.
  Use this for reducers, state machines, selectors, score models, and tuning configs.
---

# Skill: Create a Game State Module

Use this skill to build deterministic state and rules modules that stay independent from rendering concerns.

---

## Process

### Step 1: Define Ownership and Requirement IDs

1. Read the applicable requirement IDs in [docs/PRD.md](../../../docs/PRD.md).
2. Confirm whether the module belongs to gameplay, progression, or shared configuration ownership.
3. List state inputs, state outputs, and acceptance IDs before writing code.

### Step 2: Model Types First

Define explicit input, state, and output types before implementation.

```ts
export interface ExampleState {
  status: 'idle' | 'active' | 'complete' | 'failed';
}

export interface ExampleInput {
  tickMs: number;
}

export function reduceExampleState(
  state: ExampleState,
  input: ExampleInput,
): ExampleState {
  return state;
}
```

### Step 3: Keep Logic Deterministic

1. Isolate randomness, time, and persistence behind injectable dependencies.
2. Prefer pure reducers, selectors, or explicit transition functions.
3. Return data structures the UI can render directly without recomputing rules.

### Step 4: Add Traceable Tests

1. Write tests for transitions, edge cases, and invalid inputs.
2. Tag test names with the relevant requirement IDs when practical.

---

## Reference

See [docs/PRD.md](../../../docs/PRD.md) for the full specification:

- **Section 7** — Architecture and ownership boundaries
- **Section 8** — Functional requirements for gameplay and progression
- **Section 13** — System states and lifecycle
- **Section 17** — Acceptance criteria for run logic and persistence
