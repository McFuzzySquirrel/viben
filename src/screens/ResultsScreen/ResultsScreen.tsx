import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

const placeholderMetrics = [
  { label: 'Score', value: '—' },
  { label: 'Stars', value: '—' },
  { label: 'Accuracy', value: '—' },
];

export function ResultsScreen() {
  return (
    <section className="screen">
      <p className="screen__eyebrow">Results shell</p>
      <h2>Run summary placeholder</h2>
      <p className="screen__lead">
        This route is wired for future score summaries, note-performance metrics, and replay
        actions once gameplay and persistence systems land.
      </p>

      <div className="metric-grid">
        {placeholderMetrics.map((metric) => (
          <article className="panel metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="button-row">
        <Link className="button" to={APP_ROUTE_PATHS.game}>
          Retry shell
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
          Open progress shell
        </Link>
      </div>
    </section>
  );
}
