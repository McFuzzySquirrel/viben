import { Link } from 'react-router-dom';
import { useMicrophoneInput } from '@features/audio';
import { StatusBadge } from '@features/game/components';
import { useDifficultySelection } from '@features/settings';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function formatPermissionLabel(permission: ReturnType<typeof useMicrophoneInput>['state']['permission']) {
  switch (permission) {
    case 'granted':
      return 'Permission already granted';
    case 'denied':
      return 'Permission blocked by browser';
    case 'requesting':
      return 'Browser prompt in progress';
    case 'prompt':
      return 'Browser will ask when gameplay starts';
    case 'unsupported':
      return 'Browser cannot provide microphone access';
    case 'error':
      return 'Microphone setup error';
    default:
      return 'Permission not requested yet';
  }
}

function formatReadinessLabel(readiness: ReturnType<typeof useMicrophoneInput>['state']['readiness']) {
  switch (readiness) {
    case 'capturing':
      return 'Listening for live input';
    case 'ready':
      return 'Ready for the next mic check';
    case 'blocked':
      return 'Blocked until browser issue is fixed';
    case 'error':
      return 'Needs recovery before a run';
    default:
      return 'Waiting to enter the game route';
  }
}

export function HomeScreen() {
  const microphone = useMicrophoneInput();
  const {
    availableDifficulties,
    persistenceIssues,
    persistenceStatus,
    selectedDifficulty,
    selectedDifficultyId,
    setSelectedDifficulty,
  } = useDifficultySelection();

  const microphoneTone = !microphone.state.support.isSupported || microphone.state.permission === 'denied'
    ? 'danger'
    : microphone.state.permission === 'granted'
      ? 'success'
      : 'info';

  const persistenceTone = persistenceIssues.length > 0 ? 'warning' : 'success';

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Launch pad</p>
          <h2>Start the Phase 1 singing run flow from a clear home screen.</h2>
          <p className="screen__lead">
            Pick a difficulty, review the microphone expectation, and move into the routed game
            shell for the future mic check and note-matching loop.
          </p>

          <div className="status-row" aria-label="Current setup summary">
            <StatusBadge label={selectedDifficulty.label} tone="success" />
            <StatusBadge label={formatPermissionLabel(microphone.state.permission)} tone={microphoneTone} />
            <StatusBadge label={`Save status: ${persistenceStatus}`} tone={persistenceTone} />
          </div>

          <div className="button-row">
            <Link className="button" to={APP_ROUTE_PATHS.game}>
              Open microphone check shell
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
              Review local progress shell
            </Link>
          </div>
        </div>

        <aside className="panel">
          <h3>What happens next</h3>
          <ol className="step-list">
            <li>Carry your selected difficulty into the routed game shell.</li>
            <li>Confirm microphone permission before the real run loop begins.</li>
            <li>Follow one solfege prompt at a time once Phase 2 gameplay lands.</li>
          </ol>
          <p className="panel__supporting-copy">
            Audio analysis remains local-only. No raw recordings, telemetry, or account setup are
            introduced in the foundation.
          </p>
        </aside>
      </div>

      <div className="screen-grid">
        <article className="panel">
          <fieldset className="selection-group">
            <legend>Choose a launch difficulty</legend>
            <p className="panel__supporting-copy" id="difficulty-help">
              This selection is saved locally so later routes can reuse the same difficulty contract.
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
            The browser will request microphone access on the game route before a real singing run
            can begin.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Support</dt>
              <dd>{microphone.state.support.isSupported ? 'Supported in this browser' : 'Blocked in this browser'}</dd>
            </div>
            <div>
              <dt>Permission</dt>
              <dd>{formatPermissionLabel(microphone.state.permission)}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{formatReadinessLabel(microphone.state.readiness)}</dd>
            </div>
          </dl>
          {microphone.state.lastError ? (
            <p className="inline-message inline-message--warning" role="alert">
              {microphone.state.lastError.message}
            </p>
          ) : (
            <p className="inline-message">
              If access is denied later, the game shell will show a recovery message instead of
              starting the run silently.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Phase 1 routing handoff</h3>
          <ul className="feature-list">
            <li>Home is now the stable launch point for future start-run flow work.</li>
            <li>Game receives the selected difficulty and microphone setup expectations.</li>
            <li>Results and Progress routes stay reachable without changing the route contract.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
