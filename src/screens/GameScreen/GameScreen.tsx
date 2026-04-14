import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  type PitchClassification,
  selectPitchTargetSnapshot,
} from '@features/audio';
import { HudMeter, PromptFocusCard, StatusBadge } from '@features/game/components';
import {
  useGameRunController,
} from '@features/game';
import { useDifficultySelection } from '@features/settings';
import { buildDifficultySolfegeWindows } from '@shared/config/difficulty';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function clampPercent(percent: number) {
  return Math.max(0, Math.min(100, percent));
}

function toReadableClassificationLabel(classification: PitchClassification | null) {
  switch (classification) {
    case 'note':
      return 'Pitch detected inside the solfege range';
    case 'unusable':
      return 'Signal detected, but the note is not stable enough to classify';
    case 'out-of-range':
      return 'Pitch detected outside the supported note windows';
    case 'silence':
      return 'No stable singing input detected';
    default:
      return 'Waiting for microphone input';
  }
}

function getFeedbackCopy(
  matchState: ReturnType<typeof selectPitchTargetSnapshot>['matchState'],
  promptLabel: string,
  detectedLabel: string,
  classification: PitchClassification | null,
) {
  if (classification === 'unusable') {
    return {
      badge: 'Stabilize input',
      detail: `The microphone hears sound, but not a stable note yet. Hold ${promptLabel} a little more steadily.`,
    };
  }

  switch (matchState) {
    case 'correct':
      return {
        badge: 'On target',
        detail: `Nice — keep holding ${promptLabel} to feed future rocket thrust and prompt-clear feedback.`,
      };
    case 'incorrect':
      return {
        badge: 'Adjust pitch',
        detail: `The shell hears ${detectedLabel}. Slide toward ${promptLabel} for future success feedback.`,
      };
    default:
      return {
        badge: 'Need input',
        detail: `Sing or hum ${promptLabel} when the microphone is ready so the rocket response has something to follow.`,
      };
  }
}

function getMicrophoneTone(audio: ReturnType<typeof useGameRunController>['audio']) {
  if (
    audio.setup.stage === 'unsupported' ||
    audio.setup.stage === 'blocked' ||
    audio.setup.stage === 'error'
  ) {
    return 'danger';
  }

  if (audio.setup.stage === 'capturing' || audio.setup.stage === 'ready') {
    return 'success';
  }

  return 'info';
}

function getRocketStatusLabel(
  audio: ReturnType<typeof useGameRunController>['audio'],
  matchState: ReturnType<typeof selectPitchTargetSnapshot>['matchState'],
) {
  if (audio.setup.stage === 'unsupported' || audio.setup.stage === 'blocked') {
    return 'Rocket offline';
  }

  if (!audio.state.isCapturing) {
    return 'Awaiting mic check';
  }

  if (matchState === 'correct') {
    return 'Rocket boosting';
  }

  if (matchState === 'incorrect') {
    return 'Rocket drifting';
  }

  return 'Rocket idling';
}

export function GameScreen() {
  const { selectedDifficulty, selectedDifficultyId } = useDifficultySelection();
  const navigate = useNavigate();
  const gameplay = useGameRunController(selectedDifficultyId);
  const navigatedSummaryIdRef = useRef<string | null>(null);
  const { audio, currentPrompt, hud, state } = gameplay;
  const latestSample = audio.latestSample;
  const target = audio.target;
  const detectedLabel = latestSample?.noteId?.toUpperCase() ?? latestSample?.nearestNoteId?.toUpperCase() ?? 'No note yet';
  const matchState = target.matchState;
  const feedbackCopy = getFeedbackCopy(
    matchState,
    currentPrompt?.label ?? 'the target note',
    detectedLabel,
    latestSample?.classification ?? null,
  );
  const canStartRun = gameplay.canStartRun;
  const microphoneTone = getMicrophoneTone(audio);
  const rocketStatusLabel = getRocketStatusLabel(audio, matchState);
  const promptCadenceMs =
    state.status === 'active'
      ? state.run.tuning.promptCadenceMs
      : state.status === 'setup'
        ? state.tuning.promptCadenceMs
        : selectedDifficulty.tuning.promptCadenceMs;
  const targetAltitude =
    state.status === 'active'
      ? state.run.tuning.targetAltitude
      : state.status === 'setup'
        ? state.tuning.targetAltitude
        : 1000;
  const solfegeWindows = buildDifficultySolfegeWindows(selectedDifficultyId);
  const hudAltitudePercent = clampPercent(hud?.altitudePercent ?? 0);
  const hudStabilityPercent = clampPercent(hud?.stabilityPercent ?? 0);
  const hudPromptHoldPercent = clampPercent(hud?.promptHoldPercent ?? 0);
  const hudThrustPercent = clampPercent(hud?.thrustPercent ?? 0);

  useEffect(() => {
    if (state.status !== 'results') {
      return;
    }

    if (navigatedSummaryIdRef.current === state.summary.id) {
      return;
    }

    navigatedSummaryIdRef.current = state.summary.id;
    navigate(APP_ROUTE_PATHS.results, {
      state: {
        runSummary: state.summary,
      },
    });
  }, [navigate, state]);

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Gameplay shell</p>
          <h2>Run the live microphone check inside an intentional, accessible HUD shell.</h2>
          <p className="screen__lead">
            This Phase 2 route frames the audio and gameplay contracts as a live singing run:
            one target note, clear microphone status, and visible rocket-response feedback.
          </p>

          <div className="status-row" aria-label="Gameplay shell status">
            <StatusBadge label={selectedDifficulty.label} tone="success" />
            <StatusBadge
              label={rocketStatusLabel}
              tone={matchState === 'correct' ? 'success' : matchState === 'incorrect' ? 'warning' : 'info'}
            />
            <StatusBadge
              label={
                canStartRun
                  ? 'Run ready to launch'
                  : state.status === 'active'
                    ? 'Run in progress'
                    : 'Needs mic readiness before launch'
              }
              tone={canStartRun || state.status === 'active' ? 'success' : microphoneTone}
            />
          </div>
        </div>

        <aside className="panel">
          <h3>Playable run scope</h3>
          <ul className="feature-list">
            <li>Prompts advance through a live run while current pitch match drives rocket behavior.</li>
            <li>Hazards and boosts enter the same loop as altitude, stability, and score changes.</li>
            <li>Failure and moon-reached outcomes emit typed summaries for the results route.</li>
          </ul>
        </aside>
      </div>

      <div className="screen-grid screen-grid--game">
        <PromptFocusCard
          classificationLabel={toReadableClassificationLabel(latestSample?.classification ?? null)}
          detectedLabel={detectedLabel}
          feedbackDetail={feedbackCopy.detail}
          feedbackLabel={feedbackCopy.badge}
          matchState={matchState}
          promptLabel={currentPrompt?.label ?? 'Preparing note'}
          promptScientificPitch={currentPrompt?.scientificPitch ?? '—'}
        />

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Rocket response loop</p>
              <h3>Altitude, stability, prompt hold, and thrust update together</h3>
            </div>
            <StatusBadge label={hud?.rocketMode ?? 'steady'} tone="info" />
          </div>

          <HudMeter
            hint="Moon progress is driven by the reducer-backed gameplay loop."
            label="Moon progress"
            percent={hudAltitudePercent}
            tone={matchState === 'correct' ? 'success' : 'neutral'}
            valueText={`${Math.round(hud?.altitude ?? 0)} / ${Math.round(hud?.targetAltitude ?? 1000)}`}
          />
          <HudMeter
            hint="Lower stability should remain readable without relying on color alone."
            label="Rocket stability"
            percent={hudStabilityPercent}
            tone={hudStabilityPercent < 35 ? 'warning' : 'success'}
            valueText={`${Math.round(hud?.stability ?? 0)} / 100`}
          />
          <HudMeter
            hint="Prompt hold climbs only while the current target note is matched."
            label="Prompt hold"
            percent={hudPromptHoldPercent}
            tone={matchState === 'correct' ? 'success' : 'warning'}
            valueText={`${Math.round(hudPromptHoldPercent)}%`}
          />
          <HudMeter
            hint="Thrust mirrors the current simulation response, including negative drift pressure."
            label="Engine thrust"
            percent={hudThrustPercent}
            tone={matchState === 'correct' ? 'success' : 'warning'}
            valueText={`${Math.round(hudThrustPercent)}%`}
          />
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Microphone controls</p>
              <h3>Permission and readiness messaging</h3>
            </div>
            <StatusBadge label={`${audio.state.permission} / ${audio.setup.stage}`} tone={microphoneTone} />
          </div>

          <p className="panel__supporting-copy">
            Microphone processing stays local in the browser. No raw audio buffers or recordings are
            saved while using this run loop.
          </p>

          {audio.state.lastError ? (
            <p className="inline-message inline-message--warning" role="alert">
              {audio.state.lastError.message}
            </p>
          ) : null}

          <div className="button-row">
            <button
              className="button"
              onClick={() => void gameplay.requestMicrophoneAccess()}
              type="button"
            >
              {audio.state.isCapturing ? 'Refresh microphone capture' : 'Request microphone access'}
            </button>
            <button
              className="button"
              disabled={!canStartRun && state.status !== 'active'}
              onClick={() => void (state.status === 'active' ? gameplay.restartRun() : gameplay.startRun())}
              type="button"
            >
              {state.status === 'active' ? 'Restart run' : 'Start run'}
            </button>
            <button
              className="button button--secondary"
              disabled={!gameplay.canAbandonRun}
              onClick={gameplay.abandonRun}
              type="button"
            >
              End run
            </button>
            <button
              className="button button--secondary"
              disabled={!audio.state.isCapturing}
              onClick={() => void audio.stopCapture()}
              type="button"
            >
              Stop microphone capture
            </button>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Current permission</dt>
              <dd>{audio.state.permission}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{audio.setup.stage}</dd>
            </div>
            <div>
              <dt>Detected frequency</dt>
              <dd>
                {latestSample?.frequencyHz ? `${latestSample.frequencyHz.toFixed(1)} Hz` : 'Waiting for stable pitch'}
              </dd>
            </div>
            <div>
              <dt>Capture format</dt>
              <dd>
                {audio.state.captureMetrics
                  ? `${audio.state.captureMetrics.frameSize} samples @ ${audio.state.captureMetrics.sampleRate} Hz`
                  : 'Available after microphone capture starts'}
              </dd>
            </div>
            <div>
              <dt>Target match</dt>
              <dd>{target.matchState}</dd>
            </div>
            <div>
              <dt>Run state</dt>
              <dd>{state.status}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>{hud?.score ?? 0}</dd>
            </div>
            <div>
              <dt>Nearest note</dt>
              <dd>{target.nearestNoteId?.toUpperCase() ?? 'No stable note yet'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Run telemetry</p>
              <h3>Stable outputs for results and future HUD work</h3>
            </div>
            <StatusBadge label={`${solfegeWindows.length} note windows ready`} tone="info" />
          </div>

          <dl className="detail-list">
            <div>
              <dt>Difficulty</dt>
              <dd>{selectedDifficulty.label}</dd>
            </div>
            <div>
              <dt>Prompt cadence</dt>
              <dd>{promptCadenceMs} ms</dd>
            </div>
            <div>
              <dt>Target altitude</dt>
              <dd>{targetAltitude} altitude units</dd>
            </div>
            <div>
              <dt>Note tolerance</dt>
              <dd>±{selectedDifficulty.tuning.noteWindowCentsTolerance} cents</dd>
            </div>
            <div>
              <dt>Prompts cleared</dt>
              <dd>{hud?.promptsCleared ?? 0}</dd>
            </div>
            <div>
              <dt>Prompts presented</dt>
              <dd>{hud?.promptsPresented ?? 0}</dd>
            </div>
            <div>
              <dt>Active event</dt>
              <dd>{hud?.activeEvent ? `${hud.activeEvent.kind} active` : 'None'}</dd>
            </div>
          </dl>

          <div className="button-row">
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
              Return to launch pad
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
              View progress shell
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
