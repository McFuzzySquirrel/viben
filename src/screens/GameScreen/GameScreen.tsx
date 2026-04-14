import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

export function GameScreen() {
  return (
    <section className="screen">
      <p className="screen__eyebrow">Game shell</p>
      <h2>Gameplay route placeholder</h2>
      <p className="screen__lead">
        The active run surface is reserved for microphone setup, prompt logic, rocket simulation,
        and HUD systems in later Phase 1 and Phase 2 work.
      </p>

      <div className="screen-grid">
        <article className="panel">
          <h3>Reserved integration zones</h3>
          <ul className="feature-list">
            <li>Pre-run microphone readiness and blocked/error states.</li>
            <li>Real-time note prompt, pitch state, and rocket response modules.</li>
            <li>Keyboard-friendly shell controls and route-safe exit paths.</li>
          </ul>
        </article>

        <article className="panel">
          <h3>Phase 1 placeholder actions</h3>
          <div className="button-row">
            <Link className="button" to={APP_ROUTE_PATHS.results}>
              Review placeholder results
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
              Return home
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
