import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  type PitchClassification,
  selectPitchTargetSnapshot,
  useGameplayAudioInput,
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
import { buildDifficultySolfegeWindows, getDifficultyCalibration } from '@shared/config/difficulty';
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

function getMicrophoneTone(audio: ReturnType<typeof useGameplayAudioInput>) {
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
  audio: ReturnType<typeof useGameplayAudioInput>,
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
  const calibration = useMemo(
    () => getDifficultyCalibration(selectedDifficultyId),
    [selectedDifficultyId],
  );

  const baseSetupState = useMemo(() => createSetupState(selectedDifficultyId), [selectedDifficultyId]);
  const audio = useGameplayAudioInput(baseSetupState.promptPreview.currentPrompt?.noteId ?? null, calibration);

  const setupState = useMemo(() => {
    if (audio.isReadyForGameplay || audio.state.isCapturing) {
      const nextState = gameStateReducer(baseSetupState, { type: 'mark-setup-ready' });

      return nextState.status === 'setup' ? nextState : baseSetupState;
    }

    return baseSetupState;
  }, [audio.isReadyForGameplay, audio.state.isCapturing, baseSetupState]);

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
  const latestSample = audio.latestSample;
  const target = useMemo(
    () => selectPitchTargetSnapshot(latestSample, currentPrompt?.noteId ?? null, calibration),
    [calibration, currentPrompt?.noteId, latestSample],
  );
  const detectedLabel = latestSample?.noteId?.toUpperCase() ?? latestSample?.nearestNoteId?.toUpperCase() ?? 'No note yet';
  const matchState = target.matchState;
  const feedbackCopy = getFeedbackCopy(
    matchState,
    currentPrompt?.label ?? 'the target note',
    detectedLabel,
    latestSample?.classification ?? null,
  );
  const canStartRun = selectCanStartRun(setupState) && audio.isReadyForGameplay;
  const microphoneTone = getMicrophoneTone(audio);
  const rocketStatusLabel = getRocketStatusLabel(audio, matchState);
  const tuning = setupState.tuning;
  const solfegeWindows = buildDifficultySolfegeWindows(selectedDifficultyId);
  const shellAltitudePercent = clampPercent(
    (runProgress?.altitudePercent ?? 0) + (matchState === 'correct' ? 18 : matchState === 'incorrect' ? 6 : 0),
  );
  const shellStabilityPercent = clampPercent(
    (runProgress?.stabilityPercent ?? 0) +
      (matchState === 'correct' ? 0 : matchState === 'incorrect' ? -18 : audio.state.isCapturing ? -10 : -22),
  );
  const shellPromptHoldPercent = clampPercent(
    (runProgress?.promptProgressPercent ?? 0) + (matchState === 'correct' ? 42 : matchState === 'incorrect' ? 14 : 0),
  );
  const shellThrustPercent =
    !audio.state.isCapturing ? 0 : matchState === 'correct' ? 82 : matchState === 'incorrect' ? 40 : 14;

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
            <StatusBadge label={rocketStatusLabel} tone={matchState === 'correct' ? 'success' : 'info'} />
            <StatusBadge
               label={canStartRun ? 'Ready for future run start' : 'Needs mic readiness before run start'}
               tone={canStartRun ? 'success' : microphoneTone}
             />
          </div>
        </div>

        <aside className="panel">
          <h3>Phase 2 audio scope</h3>
          <ul className="feature-list">
            <li>Uses selected difficulty and gameplay setup contracts without reloading the page.</li>
            <li>Surfaces microphone permission, blocked states, and readiness with player-facing messaging.</li>
            <li>Shows live pitch classification and match-state contracts that gameplay can consume next.</li>
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
            hint="Preview meter until the gameplay run loop starts consuming live match-state updates."
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
            <StatusBadge label={`${audio.state.permission} / ${audio.setup.stage}`} tone={microphoneTone} />
          </div>

          <p className="panel__supporting-copy">
            Microphone processing stays local in the browser. No raw audio buffers or recordings are
            saved while using this shell.
          </p>

          {audio.state.lastError ? (
            <p className="inline-message inline-message--warning" role="alert">
              {audio.state.lastError.message}
            </p>
          ) : null}

          <div className="button-row">
            <button
              className="button"
              onClick={() => void audio.requestMicrophoneAccess()}
              type="button"
            >
              {audio.state.isCapturing ? 'Refresh microphone capture' : 'Request microphone access'}
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
              <dt>Nearest note</dt>
              <dd>{target.nearestNoteId?.toUpperCase() ?? 'No stable note yet'}</dd>
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
