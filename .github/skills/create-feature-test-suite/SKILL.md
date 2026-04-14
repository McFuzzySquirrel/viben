---
name: create-feature-test-suite
description: >
  Build a Vib'N test suite for a feature area using the PRD ownership matrix, acceptance criteria,
  and the project's unit, integration, and manual test strategy.
---

# Skill: Create a Feature Test Suite

Use this skill to turn a PRD requirement group into unit tests, integration tests, and manual validation notes.

---

## Process

### Step 1: Map Requirements to Coverage

1. Read the relevant IDs and owning agent in [docs/PRD.md](../../../docs/PRD.md), especially **Section 7.5** and **Section 17**.
2. List which checks should be automated versus manually verified.
3. Identify required mocks for microphone, routing, gameplay state, or local storage.

### Step 2: Build the Automated Test Skeleton

```ts
describe('REQ-ID feature area', () => {
  it('handles the expected happy path', () => {
    // arrange / act / assert
  });
});
```

Create deterministic helpers so the same suite can cover nominal, error, and boundary cases.

### Step 3: Add Non-Functional and Privacy Assertions

1. Add assertions for blocked states, persistence rules, or inaccessible flows when they are part of the feature.
2. Record any manual profiling or cross-browser checks required by the PRD.

### Step 4: Produce a Coverage Summary

1. Note which requirement IDs are covered by which tests.
2. Flag any gaps that require another agent to finish implementation first.

---

## Reference

See [docs/PRD.md](../../../docs/PRD.md) for the full specification:

- **Section 7.5** — Primary ownership for each requirement ID
- **Section 9** — Non-functional quality targets
- **Section 10** — Security and privacy checks
- **Section 15** — Testing strategy and key scenarios
- **Section 17** — Acceptance criteria
