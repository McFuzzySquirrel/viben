import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useMicrophoneInput,
  usePitchMonitor,
  type PitchClassification,
  type PitchTargetMatchState,
} from '@features/audio';
import { HudMeter, PromptFocusCard, StatusBadge } from '@features/game/components';
import {
  createInitialGameState,
  createSetupState,
  gameStateReducer,
  selectCanStartRun,
  selectCurrentPrompt,
  selectRocketState,
  selectRunProgress,
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
    case 'out-of-range':
      return 'Pitch detected outside the supported note windows';
    case 'silence':
      return 'No stable singing input detected';
    default:
      return 'Waiting for microphone input';
  }
}

function deriveShellMatchState(
  latestNoteId: string | null | undefined,
  promptNoteId: string | null | undefined,
  isCapturing: boolean,
): PitchTargetMatchState {
  if (!isCapturing || !latestNoteId || !promptNoteId) {
    return 'missing';
  }

  return latestNoteId === promptNoteId ? 'correct' : 'incorrect';
}

function getFeedbackCopy(
  matchState: PitchTargetMatchState,
  promptLabel: string,
  detectedLabel: string,
) {
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

function getMicrophoneTone(microphone: ReturnType<typeof useMicrophoneInput>) {
  if (!microphone.state.support.isSupported || microphone.state.permission === 'denied') {
    return 'danger';
  }

  if (microphone.state.readiness === 'capturing' || microphone.state.permission === 'granted') {
    return 'success';
  }

  return 'info';
}

function getRocketStatusLabel(
  matchState: PitchTargetMatchState,
  microphone: ReturnType<typeof useMicrophoneInput>,
) {
  if (!microphone.state.support.isSupported || microphone.state.readiness === 'blocked') {
    return 'Rocket offline';
  }

  if (!microphone.state.isCapturing) {
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
  const microphone = useMicrophoneInput();
  const pitchMonitor = usePitchMonitor(microphone.session);
  const { selectedDifficulty, selectedDifficultyId } = useDifficultySelection();

  const baseSetupState = useMemo(() => createSetupState(selectedDifficultyId), [selectedDifficultyId]);

  const setupState = useMemo(() => {
    if (microphone.state.readiness === 'ready' || microphone.state.readiness === 'capturing') {
      const nextState = gameStateReducer(baseSetupState, { type: 'mark-setup-ready' });

      return nextState.status === 'setup' ? nextState : baseSetupState;
    }

    return baseSetupState;
  }, [baseSetupState, microphone.state.readiness]);

  const previewRunState = useMemo(
    () =>
      gameStateReducer(createInitialGameState(selectedDifficultyId), {
        type: 'start-run',
        runId: 'phase-1-shell-preview',
        startedAtIso: '1970-01-01T00:00:00.000Z',
        startedAtMs: 0,
        promptSequence: setupState.promptPreview.sequence,
      }),
    [selectedDifficultyId, setupState.promptPreview.sequence],
  );

  const currentPrompt = selectCurrentPrompt(previewRunState) ?? selectCurrentPrompt(setupState);
  const rocketState = selectRocketState(previewRunState);
  const runProgress = selectRunProgress(previewRunState);
  const promptNoteId = currentPrompt?.noteId ?? null;
  const latestSample = pitchMonitor.latestSample;
  const latestNoteId = latestSample?.noteId ?? latestSample?.nearestNoteId ?? null;
  const detectedLabel = latestSample?.noteId?.toUpperCase() ?? latestSample?.nearestNoteId?.toUpperCase() ?? 'No note yet';
  const matchState = deriveShellMatchState(latestSample?.noteId, promptNoteId, microphone.state.isCapturing);
  const feedbackCopy = getFeedbackCopy(matchState, currentPrompt?.label ?? 'the target note', detectedLabel);
  const canStartRun = selectCanStartRun(setupState);
  const microphoneTone = getMicrophoneTone(microphone);
  const rocketStatusLabel = getRocketStatusLabel(matchState, microphone);
  const tuning = setupState.tuning;
  const solfegeWindows = buildDifficultySolfegeWindows(selectedDifficultyId);
  const shellAltitudePercent = clampPercent(
    (runProgress?.altitudePercent ?? 0) + (matchState === 'correct' ? 18 : matchState === 'incorrect' ? 6 : 0),
  );
  const shellStabilityPercent = clampPercent(
    (runProgress?.stabilityPercent ?? 0) +
      (matchState === 'correct' ? 0 : matchState === 'incorrect' ? -18 : microphone.state.isCapturing ? -10 : -22),
  );
  const shellPromptHoldPercent = clampPercent(
    (runProgress?.promptProgressPercent ?? 0) + (matchState === 'correct' ? 42 : matchState === 'incorrect' ? 14 : 0),
  );
  const shellThrustPercent =
    !microphone.state.isCapturing ? 0 : matchState === 'correct' ? 82 : matchState === 'incorrect' ? 40 : 14;

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Gameplay shell</p>
          <h2>Present the future run loop as an intentional, accessible HUD shell.</h2>
          <p className="screen__lead">
            This Phase 1 route now frames the audio and gameplay contracts as a future singing run:
            one target note, clear microphone status, and visible rocket-response placeholders.
          </p>

          <div className="status-row" aria-label="Gameplay shell status">
            <StatusBadge label={selectedDifficulty.label} tone="success" />
            <StatusBadge label={rocketStatusLabel} tone={matchState === 'correct' ? 'success' : 'info'} />
            <StatusBadge
              label={canStartRun ? 'Ready for future run start' : 'Needs mic readiness before run start'}
              tone={canStartRun ? 'success' : microphoneTone}
            />
          </div>
        </div>

        <aside className="panel">
          <h3>Phase 1 scope</h3>
          <ul className="feature-list">
            <li>Uses selected difficulty and gameplay setup contracts without starting the full run loop.</li>
            <li>Surfaces microphone permission and readiness with player-facing messaging.</li>
            <li>Shows placeholder correctness and rocket feedback that later agents can replace with live gameplay.</li>
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
              <p className="screen__eyebrow">Rocket response shell</p>
              <h3>HUD scaffolding for altitude, stability, and prompt hold</h3>
            </div>
            <StatusBadge label={rocketState?.mode ?? 'steady'} tone="info" />
          </div>

          <HudMeter
            hint="Phase 1 preview meter. Real altitude changes arrive with the gameplay run loop."
            label="Moon progress"
            percent={shellAltitudePercent}
            tone={matchState === 'correct' ? 'success' : 'neutral'}
            valueText={`${Math.round((shellAltitudePercent / 100) * tuning.targetAltitude)} / ${tuning.targetAltitude}`}
          />
          <HudMeter
            hint="Lower stability should remain readable without relying on color alone."
            label="Rocket stability"
            percent={shellStabilityPercent}
            tone={shellStabilityPercent < 35 ? 'warning' : 'success'}
            valueText={`${Math.round(shellStabilityPercent)}%`}
          />
          <HudMeter
            hint="This stands in for the future time-on-note hold feedback."
            label="Prompt hold"
            percent={shellPromptHoldPercent}
            tone={matchState === 'correct' ? 'success' : 'warning'}
            valueText={`${Math.round(shellPromptHoldPercent)}%`}
          />
          <HudMeter
            hint="Thrust responds visibly here before final rocket simulation lands."
            label="Engine thrust"
            percent={shellThrustPercent}
            tone={matchState === 'correct' ? 'success' : 'warning'}
            valueText={`${shellThrustPercent}%`}
          />
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Microphone controls</p>
              <h3>Permission and readiness messaging</h3>
            </div>
            <StatusBadge
              label={`${microphone.state.permission} / ${microphone.state.readiness}`}
              tone={microphoneTone}
            />
          </div>

          <p className="panel__supporting-copy">
            Microphone processing stays local in the browser. No raw audio buffers or recordings are
            saved while using this shell.
          </p>

          {microphone.state.lastError ? (
            <p className="inline-message inline-message--warning" role="alert">
              {microphone.state.lastError.message}
            </p>
          ) : null}

          <div className="button-row">
            <button
              className="button"
              onClick={() => void microphone.requestMicrophoneAccess()}
              type="button"
            >
              {microphone.state.isCapturing ? 'Refresh microphone capture' : 'Request microphone access'}
            </button>
            <button
              className="button button--secondary"
              disabled={!microphone.state.isCapturing}
              onClick={() => void microphone.stopCapture()}
              type="button"
            >
              Stop microphone capture
            </button>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Current permission</dt>
              <dd>{microphone.state.permission}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{microphone.state.readiness}</dd>
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
                {microphone.state.captureMetrics
                  ? `${microphone.state.captureMetrics.frameSize} samples @ ${microphone.state.captureMetrics.sampleRate} Hz`
                  : 'Available after microphone capture starts'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Contract preview</p>
              <h3>Gameplay tuning handoff</h3>
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
              <dd>{tuning.promptCadenceMs} ms</dd>
            </div>
            <div>
              <dt>Target altitude</dt>
              <dd>{tuning.targetAltitude} altitude units</dd>
            </div>
            <div>
              <dt>Note tolerance</dt>
              <dd>±{selectedDifficulty.tuning.noteWindowCentsTolerance} cents</dd>
            </div>
          </dl>

          <div className="button-row">
            <Link className="button" to={APP_ROUTE_PATHS.results}>
              Open summary shell
            </Link>
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
