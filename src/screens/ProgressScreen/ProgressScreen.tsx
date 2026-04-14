import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

export function ProgressScreen() {
  return (
    <section className="screen">
      <p className="screen__eyebrow">Progress shell</p>
      <h2>Local-only progression placeholder</h2>
      <p className="screen__lead">
        This route is reserved for local run history, difficulty records, and comparison views.
        No network sync, telemetry, or account scaffolding is introduced in the foundation.
      </p>

      <div className="screen-grid">
        <article className="panel">
          <h3>Persistence expectations</h3>
          <ul className="feature-list">
            <li>Local storage only for gameplay summaries and timestamps.</li>
            <li>Graceful recovery from missing or invalid saved data.</li>
            <li>No raw audio, recordings, or personally identifying data.</li>
          </ul>
        </article>

        <article className="panel">
          <h3>Next handoff</h3>
          <p>
            Progression ownership can attach schema, migrations, and history rendering to this
            route without replacing the shared navigation contract.
          </p>
        </article>
      </div>

      <div className="button-row">
        <Link className="button" to={APP_ROUTE_PATHS.home}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
