import type {
  GameplayEventDefinition,
  GameplayEventInstance,
  GameplayEventKind,
  GameplayEventRecord,
  GameplayMetrics,
  GameplayStepInput,
  GameplayStepResult,
  RocketFlightMode,
} from './contracts';
import { advancePromptState } from './prompt';
import { createBoostCatalog, createHazardCatalog } from './tuning';

const SCORE_PER_SECOND = 30;
const PROMPT_CLEAR_SCORE = 100;

export function resolveGameplayStep(input: GameplayStepInput): GameplayStepResult {
  const seconds = input.elapsedMs / 1000;
  const promptResult = advancePromptState({
    promptState: input.promptState,
    matchState: input.audioFrame?.matchState ?? 'missing',
    elapsedMs: input.elapsedMs,
    tuning: input.tuning,
  });
  const eventResult = resolveGameplayEvent(input);
  const isBreathing = promptResult.promptOutcome === 'breathing';

  // During breathing gaps, singing input is neutral (no reward or penalty).
  // Environmental events (hazards/boosts) still apply.
  const baseResponse = isBreathing
    ? { altitudeDelta: 0, stabilityDelta: 0, scoreRate: 0, thrust: 0 }
    : getBaseResponse(input.audioFrame?.matchState ?? 'missing', input);
  const eventAltitudeDelta = (eventResult.activeEvent?.altitudePerSecond ?? 0) * seconds;
  const eventStabilityDelta = (eventResult.activeEvent?.stabilityPerSecond ?? 0) * seconds;
  const altitudeDelta = baseResponse.altitudeDelta + eventAltitudeDelta;
  const stabilityDelta = baseResponse.stabilityDelta + eventStabilityDelta;
  const nextAltitude = clamp(input.rocket.altitude + altitudeDelta, 0, input.tuning.targetAltitude);
  const nextStability = clamp(input.rocket.stability + stabilityDelta, 0, input.tuning.maxStability);
  const didClearPrompt = promptResult.promptOutcome === 'cleared';
  const scoreDelta =
    eventResult.scoreDelta +
    Math.round(baseResponse.scoreRate * seconds * input.tuning.scoreMultiplier) +
    (didClearPrompt ? Math.round(PROMPT_CLEAR_SCORE * input.tuning.scoreMultiplier) : 0);
  const nextRocket = {
    altitude: nextAltitude,
    velocity: seconds > 0 ? altitudeDelta / seconds : 0,
    stability: nextStability,
    thrust: baseResponse.thrust,
    mode: getRocketFlightMode({
      stability: nextStability,
      altitudeDelta,
      hasBoost: eventResult.activeEvent?.kind === 'boost',
      hasHazard: eventResult.activeEvent?.kind === 'hazard',
      criticalStabilityThreshold: input.tuning.criticalStabilityThreshold,
    }),
  } as const;

  // Freeze metrics during breathing — the player shouldn't be tracked while pausing.
  const metrics = isBreathing
    ? input.metrics
    : updateMetrics(input.metrics, {
        elapsedMs: input.elapsedMs,
        matchState: input.audioFrame?.matchState ?? 'missing',
        eventKind: eventResult.eventHistoryEntry?.kind ?? null,
        altitude: nextAltitude,
        stability: nextStability,
      });

  if (nextAltitude >= input.tuning.targetAltitude) {
    return {
      rocket: nextRocket,
      promptState: promptResult.promptState,
      scoreDelta: scoreDelta + input.tuning.completionBonus,
      activeEvent: eventResult.activeEvent,
      eventHistoryEntry: eventResult.eventHistoryEntry,
      metrics,
      didClearPrompt,
      outcome: 'completed',
      endReason: 'moon-reached',
    };
  }

  if (nextStability <= 0) {
    return {
      rocket: nextRocket,
      promptState: promptResult.promptState,
      scoreDelta,
      activeEvent: eventResult.activeEvent,
      eventHistoryEntry: eventResult.eventHistoryEntry,
      metrics,
      didClearPrompt,
      outcome: 'failed',
      endReason: 'stability-depleted',
    };
  }

  return {
    rocket: nextRocket,
    promptState: promptResult.promptState,
    scoreDelta,
    activeEvent: eventResult.activeEvent,
    eventHistoryEntry: eventResult.eventHistoryEntry,
    metrics,
    didClearPrompt,
    outcome: 'active',
    endReason: null,
  };
}

function resolveGameplayEvent(input: GameplayStepInput): {
  activeEvent: GameplayEventInstance | null;
  eventHistoryEntry: GameplayEventRecord | null;
  scoreDelta: number;
} {
  const hazardCatalog = input.hazardCatalog ?? createHazardCatalog(input.tuning);
  const boostCatalog = input.boostCatalog ?? createBoostCatalog(input.tuning);
  const currentEvent =
    input.activeEvent && input.nowMs < input.activeEvent.endsAtMs ? input.activeEvent : null;

  if (currentEvent) {
    return {
      activeEvent: currentEvent,
      eventHistoryEntry: null,
      scoreDelta: 0,
    };
  }

  const candidates = [...hazardCatalog, ...boostCatalog]
    .map((definition) => getTriggeredEvent(definition, input.elapsedRunMs, input.elapsedMs, input.nowMs))
    .filter((candidate): candidate is GameplayEventInstance => candidate !== null)
    .sort((left, right) => left.startedAtMs - right.startedAtMs);

  const [activeEvent] = candidates;

  if (!activeEvent) {
    return {
      activeEvent: null,
      eventHistoryEntry: null,
      scoreDelta: 0,
    };
  }

  return {
    activeEvent,
    eventHistoryEntry: {
      id: activeEvent.id,
      kind: activeEvent.kind,
      label: activeEvent.label,
      startedAtMs: activeEvent.startedAtMs,
      endsAtMs: activeEvent.endsAtMs,
    },
    scoreDelta: activeEvent.scoreDelta,
  };
}

function getTriggeredEvent(
  definition: GameplayEventDefinition,
  elapsedRunMs: number,
  elapsedMs: number,
  nowMs: number,
): GameplayEventInstance | null {
  if (definition.firstAppearanceMs != null && elapsedRunMs < definition.firstAppearanceMs) {
    return null;
  }

  const previousElapsedMs = Math.max(0, elapsedRunMs - elapsedMs);
  const previousCycle = Math.floor(previousElapsedMs / definition.cadenceMs);
  const currentCycle = Math.floor(elapsedRunMs / definition.cadenceMs);

  if (definition.cadenceMs <= 0 || currentCycle <= previousCycle || elapsedRunMs < definition.cadenceMs) {
    return null;
  }

  const startedAtMs = nowMs - (elapsedRunMs - currentCycle * definition.cadenceMs);

  return {
    ...definition,
    startedAtMs,
    endsAtMs: startedAtMs + definition.durationMs,
  };
}

function getBaseResponse(matchState: 'correct' | 'incorrect' | 'missing', input: GameplayStepInput) {
  if (matchState === 'correct') {
    return {
      altitudeDelta: (input.tuning.correctAltitudePerSecond * input.elapsedMs) / 1000,
      stabilityDelta: (input.tuning.correctStabilityPerSecond * input.elapsedMs) / 1000,
      scoreRate: SCORE_PER_SECOND,
      thrust: 1,
    };
  }

  if (matchState === 'incorrect') {
    return {
      altitudeDelta: (-input.tuning.incorrectAltitudePenaltyPerSecond * input.elapsedMs) / 1000,
      stabilityDelta: (-input.tuning.incorrectStabilityPenaltyPerSecond * input.elapsedMs) / 1000,
      scoreRate: 0,
      thrust: -0.35,
    };
  }

  return {
    altitudeDelta: (-input.tuning.missingAltitudePenaltyPerSecond * input.elapsedMs) / 1000,
    stabilityDelta: (-input.tuning.missingStabilityPenaltyPerSecond * input.elapsedMs) / 1000,
    scoreRate: 0,
    thrust: -0.5,
  };
}

function getRocketFlightMode(params: {
  stability: number;
  altitudeDelta: number;
  hasBoost: boolean;
  hasHazard: boolean;
  criticalStabilityThreshold: number;
}): RocketFlightMode {
  if (params.stability <= 0) {
    return 'offline';
  }

  if (params.stability <= params.criticalStabilityThreshold) {
    return 'critical';
  }

  if (params.hasBoost || params.altitudeDelta > 0) {
    return 'boosting';
  }

  if (params.hasHazard || params.altitudeDelta < 0) {
    return 'drifting';
  }

  return 'steady';
}

function updateMetrics(
  metrics: GameplayMetrics,
  params: {
    elapsedMs: number;
    matchState: 'correct' | 'incorrect' | 'missing';
    eventKind: GameplayEventKind | null;
    altitude: number;
    stability: number;
  },
): GameplayMetrics {
  const correctMs = metrics.correctMs + (params.matchState === 'correct' ? params.elapsedMs : 0);
  const incorrectMs = metrics.incorrectMs + (params.matchState === 'incorrect' ? params.elapsedMs : 0);
  const missingMs = metrics.missingMs + (params.matchState === 'missing' ? params.elapsedMs : 0);
  const currentCorrectStreakMs =
    params.matchState === 'correct' ? metrics.currentCorrectStreakMs + params.elapsedMs : 0;

  return {
    correctMs,
    incorrectMs,
    missingMs,
    currentCorrectStreakMs,
    longestCorrectStreakMs: Math.max(metrics.longestCorrectStreakMs, currentCorrectStreakMs),
    hazardsTriggered: metrics.hazardsTriggered + Number(params.eventKind === 'hazard'),
    boostsTriggered: metrics.boostsTriggered + Number(params.eventKind === 'boost'),
    peakAltitude: Math.max(metrics.peakAltitude, params.altitude),
    lowestStability: Math.min(metrics.lowestStability, params.stability),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
