---
name: build-browser-audio-flow
description: >
  Implement a Vib'N browser audio flow for microphone permission, capture, pitch analysis, or
  calibration while preserving privacy and low-latency constraints.
---

# Skill: Build a Browser Audio Flow

Use this skill for any microphone, Web Audio, pitch detection, or calibration task in Vib'N.

---

## Process

### Step 1: Confirm the Audio Requirement

1. Read the audio-related requirements and acceptance criteria in [docs/PRD.md](../../../docs/PRD.md).
2. Identify whether the task affects permission handling, live capture, note mapping, or calibration.
3. Confirm the latency and privacy constraints that apply.

### Step 2: Implement a Layered Audio Adapter

Separate browser APIs, analysis logic, and exported app state.

```ts
export interface PitchSample {
  frequencyHz: number | null;
  noteId: string | null;
}

export interface AudioPermissionState {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
}
```

### Step 3: Handle Unsupported and Silent Paths Explicitly

1. Represent denied permissions, unsupported browsers, silence, and unusable input as explicit states.
2. Never silently swallow setup failures.
3. Do not persist raw audio buffers, recordings, or derived voiceprints.

### Step 4: Validate the Flow

1. Add tests for permission-granted, denied, unsupported, and silence cases.
2. Document any performance-sensitive sections that QA should profile.

---

## Reference

See [docs/PRD.md](../../../docs/PRD.md) for the full specification:

- **Section 6** — Core loop with microphone readiness and singing input
- **Section 7** — Audio stack and key APIs
- **Section 9** — Latency and blocked-state non-functional requirements
- **Section 10** — Audio privacy rules
- **Section 17.2** — Audio acceptance criteria
