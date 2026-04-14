import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';
import { DEFAULT_DIFFICULTY_ID, DIFFICULTY_OPTIONS } from '@shared/types/app-shell';

export function HomeScreen() {
  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Home shell</p>
          <h2>Launch the run flow from a stable app shell.</h2>
          <p className="screen__lead">
            This foundation screen provides the Phase 1 entry point for the upcoming microphone
            readiness, gameplay, and progression work.
          </p>
          <div className="button-row">
            <Link className="button" to={APP_ROUTE_PATHS.game}>
              Start placeholder run
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
              View local progress shell
            </Link>
          </div>
        </div>

        <aside className="panel">
          <h3>Shared contracts ready for downstream agents</h3>
          <ul className="feature-list">
            <li>Route IDs and typed paths for home, game, results, and progress.</li>
            <li>Difficulty IDs with a placeholder default of {DEFAULT_DIFFICULTY_ID}.</li>
            <li>Browser support context for supported and blocked setup states.</li>
          </ul>
        </aside>
      </div>

      <div className="screen-grid">
        <article className="panel">
          <h3>Planned setup flow handoff</h3>
          <p>
            Audio ownership will attach microphone permission, readiness, and calibration behavior
            to the game route without changing the app shell contract.
          </p>
        </article>

        <article className="panel">
          <h3>Difficulty scaffold</h3>
          <ul className="feature-list">
            {DIFFICULTY_OPTIONS.map((difficulty) => (
              <li key={difficulty.id}>
                <strong>{difficulty.label}:</strong> {difficulty.summary}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
