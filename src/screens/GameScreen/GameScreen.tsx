import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { type PitchClassification } from '@features/audio';
import {
  HudMeter,
  PromptFocusCard,
  RocketFlightCard,
  StatusBadge,
} from '@features/game/components';
import { selectRunProgress, useGameRunController } from '@features/game';
import { useDifficultySelection } from '@features/settings';
import { Tooltip } from '@shared/components/Tooltip';
import { useFirstRunTooltips } from '@shared/hooks';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

interface GameLaunchRouteState {
  autoStart?: boolean;
}

function clampPercent(percent: number) {
  return Math.max(0, Math.min(100, percent));
}

function formatElapsedMs(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toReadableClassificationLabel(classification: PitchClassification | null) {
  switch (classification) {
    case 'note':
      return 'Stable note detected';
    case 'unusable':
      return 'Sound heard, but the note is unstable';
    case 'out-of-range':
      return 'Detected pitch is outside the playable note range';
    case 'silence':
      return 'No stable singing input detected';
    default:
      return 'Waiting for microphone input';
  }
}

function getFeedbackCopy(
  matchState: ReturnType<typeof useGameRunController>['audio']['target']['matchState'],
  promptLabel: string,
  detectedLabel: string,
  classification: PitchClassification | null,
) {
  if (classification === 'unusable') {
    return {
      badge: 'Hold the note steady',
      detail: `The mic hears you, but the note is wobbling. Settle onto ${promptLabel} and keep it steady.`,
    };
  }

  switch (matchState) {
    case 'correct':
      return {
        badge: 'Correct note',
        detail: `Nice work. Keep singing ${promptLabel} to keep the rocket climbing and the prompt meter filling.`,
      };
    case 'incorrect':
      return {
        badge: 'Wrong note',
        detail: `You are closest to ${detectedLabel}. Slide your pitch until it matches ${promptLabel}.`,
      };
    default:
      return {
        badge: 'Need input',
        detail: `Sing or hum ${promptLabel}. Missing input slows the rocket and drains stability.`,
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

function getRunStatus(gameplay: ReturnType<typeof useGameRunController>) {
  if (gameplay.state.status === 'active') {
    return {
      label: 'Run in progress',
      detail: 'Follow the live prompt, keep the rocket stable, and climb toward the moon.',
      tone: 'success' as const,
      alert: false,
    };
  }

  if (gameplay.state.status === 'blocked') {
    return {
      label: 'Run blocked',
      detail: gameplay.state.blocker.detail,
      tone: 'warning' as const,
      alert: true,
    };
  }

  switch (gameplay.audio.setup.stage) {
    case 'capturing':
      return {
        label: 'Mic ready — launch when ready',
        detail: 'Your microphone is live. Start the run to begin the first prompt immediately.',
        tone: 'success' as const,
        alert: false,
      };
    case 'ready':
      return {
        label: 'Permission granted',
        detail: 'The browser approved microphone access. Start the run to begin singing.',
        tone: 'success' as const,
        alert: false,
      };
    case 'requesting':
      return {
        label: 'Waiting for browser permission',
        detail: 'Approve microphone access in the browser prompt to continue.',
        tone: 'info' as const,
        alert: false,
      };
    case 'blocked':
    case 'error':
    case 'unsupported':
      return {
        label: 'Microphone setup needs attention',
        detail:
          gameplay.audio.state.lastError?.message ??
          'Gameplay cannot begin until the microphone issue is resolved.',
        tone: 'warning' as const,
        alert: true,
      };
    default:
      return {
        label: 'Ready for setup',
        detail: 'Request microphone access, then start the run from this screen.',
        tone: 'info' as const,
        alert: false,
      };
  }
}

export function GameScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const autoStartHandledRef = useRef(false);
  const navigatedSummaryIdRef = useRef<string | null>(null);
  const { selectedDifficulty } = useDifficultySelection();
  const gameplay = useGameRunController(selectedDifficulty.id);
  const { audio, currentPrompt, hud, state } = gameplay;
  const runProgress = useMemo(() => selectRunProgress(state), [state]);
  const locationState = location.state as GameLaunchRouteState | null;
  const latestSample = audio.latestSample;
  const detectedLabel =
    latestSample?.noteId?.toUpperCase() ?? latestSample?.nearestNoteId?.toUpperCase() ?? 'No note yet';
  const feedbackCopy = getFeedbackCopy(
    audio.target.matchState,
    currentPrompt?.label ?? 'the target note',
    detectedLabel,
    latestSample?.classification ?? null,
  );
  const microphoneTone = getMicrophoneTone(audio);
  const runStatus = getRunStatus(gameplay);
  const altitudePercent = clampPercent(runProgress?.altitudePercent ?? hud?.altitudePercent ?? 0);
  const stabilityPercent = clampPercent(runProgress?.stabilityPercent ?? hud?.stabilityPercent ?? 0);
  const promptHoldPercent = clampPercent(runProgress?.promptProgressPercent ?? hud?.promptHoldPercent ?? 0);
  const isRunActive = state.status === 'active';

  // First-run tooltip refs
  const promptCardRef = useRef<HTMLDivElement>(null);
  const stabilityMeterRef = useRef<HTMLDivElement>(null);
  const rocketCardRef = useRef<HTMLDivElement>(null);
  const moonProgressRef = useRef<HTMLDivElement>(null);

  // First-run tooltip state — only shown during active gameplay
  const tooltips = useFirstRunTooltips();

  useEffect(() => {
    if (!locationState?.autoStart || autoStartHandledRef.current) {
      return;
    }

    autoStartHandledRef.current = true;
    void gameplay.startRun();
  }, [gameplay, locationState?.autoStart]);

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
      {!isRunActive && (
        <div className="hero">
          <div className="hero__copy">
            <p className="screen__eyebrow">Active mission</p>
            <h2>Sing the prompt and steer the rocket to the moon.</h2>
            <p className="screen__lead">
              One note prompt stays in focus at a time. Correct singing lifts the rocket, missing or
              wrong input causes visible drift, and hazards or boosts appear in the same run loop.
            </p>

            <div className="status-row" aria-label="Live run summary">
              <StatusBadge label={`Difficulty: ${selectedDifficulty.label}`} tone="success" />
              <StatusBadge label={runStatus.label} tone={runStatus.tone} />
              <StatusBadge label={`Mic: ${audio.setup.stage}`} tone={microphoneTone} />
              <span aria-live="polite" aria-atomic="true">
                <StatusBadge label={`Score: ${hud?.score ?? 0}`} tone="info" />
              </span>
            </div>

            <p
              className={`inline-message inline-message--${runStatus.tone}`}
              role={runStatus.alert ? 'alert' : undefined}
            >
              <strong>{runStatus.label}.</strong> {runStatus.detail}
            </p>

            <div className="button-row">
              <button
                className="button"
                onClick={() => void gameplay.startRun()}
                type="button"
              >
                {gameplay.latestSummary ? 'Retry run' : 'Start run'}
              </button>
              <button
                className="button button--secondary"
                disabled={!gameplay.canRetrySetup}
                onClick={() => void gameplay.requestMicrophoneAccess()}
                type="button"
              >
                {audio.state.isCapturing ? 'Refresh microphone access' : 'Request microphone access'}
              </button>
              <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
                Back to home
              </Link>
              {audio.state.isCapturing ? (
                <button
                  className="button button--secondary"
                  onClick={() => void audio.stopCapture()}
                  type="button"
                >
                  Stop mic
                </button>
              ) : null}
            </div>
          </div>

          <aside className="panel">
            <h3>Mission checklist</h3>
            <ul className="feature-list">
              <li>Watch the large solfege prompt and sing only that note.</li>
              <li>Use the moon progress, stability, and thrust HUD to read the rocket response quickly.</li>
              <li>If setup fails, use Back to home or retry microphone access without reloading the app.</li>
            </ul>
            <p className="panel__supporting-copy">
              Keyboard users can tab through every launch, retry, end-run, and recovery action on this
              screen.
            </p>
          </aside>
        </div>
      )}

      {isRunActive && (
        <div className="status-row" aria-label="Live run summary">
          <StatusBadge label={`Difficulty: ${selectedDifficulty.label}`} tone="success" />
          <StatusBadge label={runStatus.label} tone={runStatus.tone} />
          <span aria-live="polite" aria-atomic="true">
            <StatusBadge label={`Score: ${hud?.score ?? 0}`} tone="info" />
          </span>
          <button
            className="button"
            disabled={!gameplay.canAbandonRun}
            onClick={gameplay.abandonRun}
            type="button"
          >
            End run
          </button>
        </div>
      )}

      <div className="screen-grid screen-grid--game">
        <div ref={promptCardRef}>
          <PromptFocusCard
            classificationLabel={toReadableClassificationLabel(latestSample?.classification ?? null)}
            detectedLabel={detectedLabel}
            feedbackDetail={feedbackCopy.detail}
            feedbackLabel={feedbackCopy.badge}
            holdPercent={promptHoldPercent}
            matchState={audio.target.matchState}
            promptLabel={currentPrompt?.label ?? 'Preparing note'}
            promptScientificPitch={currentPrompt?.scientificPitch ?? '—'}
          />
        </div>

        <div ref={rocketCardRef}>
          <RocketFlightCard
            activeEvent={hud?.activeEvent ?? null}
            altitudePercent={altitudePercent}
            altitudeText={`${Math.round(hud?.altitude ?? 0)} / ${Math.round(hud?.targetAltitude ?? 1000)} altitude`}
            boostsTriggered={hud?.boostsTriggered ?? 0}
            hazardsTriggered={hud?.hazardsTriggered ?? 0}
            matchState={audio.target.matchState}
            rocketMode={hud?.rocketMode ?? null}
          />
        </div>

        {isRunActive ? (
          <article className="panel">
            <div className="panel__header">
              <div>
                <p className="screen__eyebrow">Rocket HUD</p>
                <h3>Read moon progress and stability at a glance</h3>
              </div>
              <StatusBadge label={hud?.rocketMode ?? 'awaiting launch'} tone="info" />
            </div>

            <div ref={moonProgressRef}>
              <HudMeter
                hint="Higher moon progress means the rocket is closer to the finish."
                label="Moon progress"
                percent={altitudePercent}
                tone={audio.target.matchState === 'correct' ? 'success' : 'neutral'}
                valueText={`${Math.round(altitudePercent)}%`}
              />
            </div>
            <div ref={stabilityMeterRef}>
              <HudMeter
                hint="If stability falls too low, the run will fail."
                label="Rocket stability"
                percent={stabilityPercent}
                tone={stabilityPercent < 35 ? 'warning' : 'success'}
                valueText={`${Math.round(hud?.stability ?? 0)} / 100`}
              />
            </div>
          </article>
        ) : (
          <>
            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="screen__eyebrow">Mission stats</p>
                  <h3>Track score, time, and prompt clears at a glance</h3>
                </div>
                <StatusBadge label={hud?.activeEvent ? 'Event active' : 'Clear sky'} tone={hud?.activeEvent ? 'warning' : 'info'} />
              </div>

              <div className="run-stat-grid">
                <article className="run-stat-card">
                  <span className="run-stat-card__label">Score</span>
                  <strong>{hud?.score ?? 0}</strong>
                </article>
                <article className="run-stat-card">
                  <span className="run-stat-card__label">Elapsed</span>
                  <strong>{formatElapsedMs(hud?.elapsedMs ?? 0)}</strong>
                </article>
                <article className="run-stat-card">
                  <span className="run-stat-card__label">Prompts cleared</span>
                  <strong>{hud?.promptsCleared ?? 0}</strong>
                </article>
                <article className="run-stat-card">
                  <span className="run-stat-card__label">Prompts shown</span>
                  <strong>{hud?.promptsPresented ?? 0}</strong>
                </article>
              </div>

              <p className="panel__supporting-copy">
                Correct note matches raise score and help clear prompts. Hazards and boosts stay visible
                through the counts and live event status.
              </p>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="screen__eyebrow">Rocket HUD</p>
                  <h3>Read moon progress and stability at a glance</h3>
                </div>
                <StatusBadge label={hud?.rocketMode ?? 'awaiting launch'} tone="info" />
              </div>

              <div ref={moonProgressRef}>
                <HudMeter
                  hint="Higher moon progress means the rocket is closer to the finish."
                  label="Moon progress"
                  percent={altitudePercent}
                  tone={audio.target.matchState === 'correct' ? 'success' : 'neutral'}
                  valueText={`${Math.round(altitudePercent)}%`}
                />
              </div>
              <div ref={stabilityMeterRef}>
                <HudMeter
                  hint="If stability falls too low, the run will fail."
                  label="Rocket stability"
                  percent={stabilityPercent}
                  tone={stabilityPercent < 35 ? 'warning' : 'success'}
                  valueText={`${Math.round(hud?.stability ?? 0)} / 100`}
                />
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="screen__eyebrow">Mic and note readout</p>
                  <h3>See what the microphone hears and how the game classifies it</h3>
                </div>
                <StatusBadge
                  label={audio.state.isCapturing ? 'Mic listening' : 'Mic idle'}
                  tone={audio.state.isCapturing ? 'success' : microphoneTone}
                />
              </div>

              {audio.state.lastError ? (
                <p className="inline-message inline-message--warning" role={runStatus.alert ? undefined : 'alert'}>
                  <strong>Microphone issue.</strong> {audio.state.lastError.message}
                </p>
              ) : null}

              <dl className="detail-list">
                <div>
                  <dt>Input status</dt>
                  <dd>{toReadableClassificationLabel(latestSample?.classification ?? null)}</dd>
                </div>
                <div>
                  <dt>Detected note</dt>
                  <dd>{detectedLabel}</dd>
                </div>
                <div>
                  <dt>Detected frequency</dt>
                  <dd>{latestSample?.frequencyHz ? `${latestSample.frequencyHz.toFixed(1)} Hz` : 'Waiting for stable pitch'}</dd>
                </div>
                <div>
                  <dt>Permission</dt>
                  <dd>{audio.state.permission}</dd>
                </div>
                <div>
                  <dt>Setup stage</dt>
                  <dd>{audio.setup.stage}</dd>
                </div>
                <div>
                  <dt>Privacy</dt>
                  <dd>Audio stays local in the browser and is not saved as recordings.</dd>
                </div>
              </dl>
            </article>
          </>
        )}
      </div>

      {/* First-run contextual tooltips — shown only during active gameplay */}
      {isRunActive ? (
        <>
          <Tooltip
            content="Sing the note shown here to control your rocket!"
            onDismiss={() => tooltips.dismiss('prompt-card')}
            onSkipAll={tooltips.dismissAll}
            position="bottom"
            targetRef={promptCardRef}
            visible={tooltips.shouldShow('prompt-card')}
          />
          <Tooltip
            content="Keep your pitch steady to maintain stability"
            onDismiss={() => tooltips.dismiss('stability-meter')}
            onSkipAll={tooltips.dismissAll}
            position="top"
            targetRef={stabilityMeterRef}
            visible={tooltips.shouldShow('stability-meter')}
          />
          <Tooltip
            content="Watch the rocket's flame — it shows how well you're matching"
            onDismiss={() => tooltips.dismiss('rocket-feedback')}
            onSkipAll={tooltips.dismissAll}
            position="bottom"
            targetRef={rocketCardRef}
            visible={tooltips.shouldShow('rocket-feedback')}
          />
          <Tooltip
            content="This tracks your journey to the moon"
            onDismiss={() => tooltips.dismiss('moon-progress')}
            onSkipAll={tooltips.dismissAll}
            position="top"
            targetRef={moonProgressRef}
            visible={tooltips.shouldShow('moon-progress')}
          />
        </>
      ) : null}
    </section>
  );
}
