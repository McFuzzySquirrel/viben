import { Link, useNavigate } from 'react-router-dom';
import { selectAudioSetupStatus, useAudioInput } from '@features/audio';
import { StatusBadge } from '@features/game/components';
import { useDifficultySelection } from '@features/settings';
import { loadVoiceProfile } from '@shared/persistence/voice-profile-storage';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

interface GameLaunchRouteState {
  autoStart?: boolean;
}

function formatSetupLabel(setupStage: ReturnType<typeof selectAudioSetupStatus>['stage']) {
  switch (setupStage) {
    case 'unsupported':
      return 'Microphone unsupported';
    case 'requesting':
      return 'Browser prompt open';
    case 'ready':
      return 'Permission granted';
    case 'capturing':
      return 'Mic live and listening';
    case 'blocked':
      return 'Microphone blocked';
    case 'error':
      return 'Microphone error';
    default:
      return 'Microphone check pending';
  }
}

function getSetupTone(setupStage: ReturnType<typeof selectAudioSetupStatus>['stage']) {
  if (setupStage === 'unsupported' || setupStage === 'blocked' || setupStage === 'error') {
    return 'danger';
  }

  if (setupStage === 'ready' || setupStage === 'capturing') {
    return 'success';
  }

  return 'info';
}

function getSetupGuidance(setup: ReturnType<typeof selectAudioSetupStatus>, lastErrorMessage: string | null) {
  switch (setup.stage) {
    case 'capturing':
      return {
        title: 'Microphone ready for launch',
        detail:
          'Your browser is already listening. Press Start singing run to jump straight into the playable HUD.',
        tone: 'success' as const,
        alert: false,
      };
    case 'ready':
      return {
        title: 'Permission granted — one step left',
        detail:
          'Your microphone permission is approved. Start the run to enter the game screen and begin the first mission.',
        tone: 'success' as const,
        alert: false,
      };
    case 'requesting':
      return {
        title: 'Check the browser permission prompt',
        detail:
          'Choose Allow in the browser prompt, then return here or continue into the game screen to begin the run.',
        tone: 'info' as const,
        alert: false,
      };
    case 'blocked':
      return {
        title: 'Microphone access is blocked',
        detail:
          lastErrorMessage ??
          'Gameplay needs microphone access. Re-enable the microphone in browser site settings, then retry.',
        tone: 'warning' as const,
        alert: true,
      };
    case 'unsupported':
      return {
        title: 'This browser cannot start the singing run',
        detail:
          lastErrorMessage ??
          'Use a secure desktop browser with MediaDevices and Web Audio support to play the run.',
        tone: 'warning' as const,
        alert: true,
      };
    case 'error':
      return {
        title: 'The microphone check hit an error',
        detail:
          lastErrorMessage ??
          'Retry the microphone check. If another app is using the device, close it before trying again.',
        tone: 'warning' as const,
        alert: true,
      };
    default:
      return {
        title: 'Microphone required for gameplay',
        detail:
          'Start from this launch pad, choose a difficulty, then allow microphone access when the browser asks.',
        tone: 'info' as const,
        alert: false,
      };
  }
}

export function HomeScreen() {
  const navigate = useNavigate();
  const microphone = useAudioInput();
  const setup = selectAudioSetupStatus(microphone.state);
  const {
    availableDifficulties,
    persistenceIssues,
    persistenceStatus,
    selectedDifficulty,
    selectedDifficultyId,
    setSelectedDifficulty,
  } = useDifficultySelection();
  const microphoneTone = getSetupTone(setup.stage);
  const persistenceTone = persistenceIssues.length > 0 ? 'warning' : 'success';
  const setupGuidance = getSetupGuidance(setup, microphone.state.lastError?.message ?? null);
  const hasVoiceProfile = loadVoiceProfile().profile !== null;

  const startRunFromHome = () => {
    navigate(APP_ROUTE_PATHS.game, {
      state: {
        autoStart: true,
      } satisfies GameLaunchRouteState,
    });
  };

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Launch pad</p>
          <h2>Choose a difficulty, confirm your mic, and launch the first playable run.</h2>
          <p className="screen__lead">
            Vib&apos;N uses live microphone input for every mission. This home screen keeps the setup
            clear: pick a challenge, understand any blocked state, and start the run without leaving
            the app shell.
          </p>

          <div className="status-row" aria-label="Current setup summary">
            <StatusBadge label={`Difficulty: ${selectedDifficulty.label}`} tone="success" />
            <StatusBadge label={formatSetupLabel(setup.stage)} tone={microphoneTone} />
            <StatusBadge label={`Save status: ${persistenceStatus}`} tone={persistenceTone} />
            <StatusBadge
              label={hasVoiceProfile ? 'Voice profile: active' : 'Voice profile: none'}
              tone={hasVoiceProfile ? 'success' : 'info'}
            />
          </div>

          <p
            className={`inline-message inline-message--${setupGuidance.tone}`}
            role={setupGuidance.alert ? 'alert' : undefined}
          >
            <strong>{setupGuidance.title}.</strong> {setupGuidance.detail}
          </p>

          <div className="button-row">
            <button className="button" onClick={startRunFromHome} type="button">
              Start singing run
            </button>
            <button
              className="button button--secondary"
              disabled={!setup.canRequestAccess}
              onClick={() => void microphone.requestMicrophoneAccess()}
              type="button"
            >
              {setup.stage === 'capturing' ? 'Refresh microphone check' : 'Check microphone now'}
            </button>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
              Review local progress
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.calibration}>
              Calibrate voice
            </Link>
          </div>
        </div>

        <aside className="panel">
          <h3>How the launch flow works</h3>
          <ol className="step-list">
            <li>Pick a difficulty that fits your voice and reaction speed.</li>
            <li>Allow microphone access when the browser asks, or use Check microphone now first.</li>
            <li>Press Start singing run to open the HUD and begin the current note mission.</li>
          </ol>
          <p className="panel__supporting-copy">
            Audio stays local in the browser. No recordings or raw voice data are stored for this
            prototype.
          </p>
        </aside>
      </div>

      <div className="screen-grid">
        <article className="panel">
          <fieldset className="selection-group">
            <legend>Choose a launch difficulty</legend>
            <p className="panel__supporting-copy" id="difficulty-help">
              This choice carries into the run and stays saved locally for the next visit.
            </p>
            <div aria-describedby="difficulty-help" className="choice-grid">
              {availableDifficulties.map((difficulty) => {
                const isSelected = difficulty.id === selectedDifficultyId;

                return (
                  <label
                    className={isSelected ? 'choice-card choice-card--selected' : 'choice-card'}
                    key={difficulty.id}
                  >
                    <input
                      checked={isSelected}
                      className="choice-card__input"
                      name="difficulty"
                      onChange={() => setSelectedDifficulty(difficulty.id)}
                      type="radio"
                      value={difficulty.id}
                    />
                    <span className="choice-card__title-row">
                      <span>{difficulty.label}</span>
                      {isSelected ? <StatusBadge label="Selected" tone="success" /> : null}
                    </span>
                    <span className="choice-card__description">{difficulty.summary}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </article>

        <article className="panel">
          <h3>Microphone requirement</h3>
          <p className="panel__supporting-copy">
            You need microphone access to fly the rocket. The game screen will never silently fail;
            it will either confirm readiness or show a clear blocked message with a way back home.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Browser support</dt>
              <dd>{microphone.state.support.isSupported ? 'Ready for microphone APIs' : 'Missing required browser APIs'}</dd>
            </div>
            <div>
              <dt>Permission</dt>
              <dd>{microphone.state.permission}</dd>
            </div>
            <div>
              <dt>Setup state</dt>
              <dd>{formatSetupLabel(setup.stage)}</dd>
            </div>
            <div>
              <dt>Current capture</dt>
              <dd>{microphone.state.isCapturing ? 'Live input detected' : 'Not yet capturing'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h3>Keyboard-friendly launch tips</h3>
          <ul className="feature-list">
            <li>Use Tab and Shift+Tab to move between difficulty cards and action buttons.</li>
            <li>Press Space or Enter on a radio button to change difficulty.</li>
            <li>Use Start singing run to move straight into the playable HUD without pointer-only steps.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
