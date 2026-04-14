import { Link } from 'react-router-dom';
import { StatusBadge } from '@features/game/components';
import { useDifficultySelection } from '@features/settings';
import { loadProgressionState } from '@shared/persistence';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function formatMetricValue(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

export function ResultsScreen() {
  const { persistenceIssues, persistenceStatus, selectedDifficulty } = useDifficultySelection();
  const progressionSnapshot = loadProgressionState();
  const latestRun = progressionSnapshot.save.runHistory[0] ?? null;
  const selectedDifficultyRecord = progressionSnapshot.save.difficultyRecords[selectedDifficulty.id];

  const resultMetrics = [
    {
      label: 'Latest outcome',
      value: latestRun ? latestRun.outcome : 'Awaiting first saved run',
    },
    {
      label: 'Selected difficulty',
      value: selectedDifficulty.label,
    },
    {
      label: 'Local runs saved',
      value: String(progressionSnapshot.save.runHistory.length),
    },
    {
      label: 'Best local score',
      value: formatMetricValue(selectedDifficultyRecord.bestScore),
    },
  ];

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Results shell</p>
          <h2>Keep the routed summary screen in place for future run outcomes.</h2>
          <p className="screen__lead">
            Phase 1 establishes the composition for score cards, retry actions, and local comparison
            links without inventing final gameplay results early.
          </p>

          <div className="status-row" aria-label="Results shell status">
            <StatusBadge label={`Save status: ${persistenceStatus}`} tone={persistenceIssues.length > 0 ? 'warning' : 'success'} />
            <StatusBadge
              label={latestRun ? `Latest stars: ${latestRun.stars}` : 'No stars yet'}
              tone={latestRun ? 'info' : 'neutral'}
            />
          </div>
        </div>

        <aside className="panel">
          <h3>Summary route handoff</h3>
          <ul className="feature-list">
            <li>Later gameplay work can inject real run summaries without changing navigation.</li>
            <li>Later progression work can attach local comparison and best-of history here.</li>
            <li>This screen already reflects the selected difficulty and current save snapshot.</li>
          </ul>
        </aside>
      </div>

      <div className="metric-grid">
        {resultMetrics.map((metric) => (
          <article className="panel metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="screen-grid">
        <article className="panel">
          <h3>Latest run placeholder</h3>
          {latestRun ? (
            <dl className="detail-list">
              <div>
                <dt>Score</dt>
                <dd>{latestRun.score}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{formatMetricValue(latestRun.performance.accuracyPercent, '%')}</dd>
              </div>
              <div>
                <dt>Time on target</dt>
                <dd>{formatMetricValue(latestRun.performance.timeOnTargetMs, ' ms')}</dd>
              </div>
              <div>
                <dt>Recorded at</dt>
                <dd>{new Date(latestRun.recordedAt).toLocaleString()}</dd>
              </div>
            </dl>
          ) : (
            <p className="panel__supporting-copy">
              No persisted run summary exists yet. Phase 2 gameplay can plug real metrics into this
              layout without replacing the route.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Comparison placeholder</h3>
          <p className="panel__supporting-copy">
            Local rivalry and prior-run deltas will appear here once real results are persisted.
          </p>
          <ul className="feature-list">
            <li>Selected difficulty best score: {formatMetricValue(selectedDifficultyRecord.bestScore)}</li>
            <li>Best stars on this difficulty: {formatMetricValue(selectedDifficultyRecord.bestStars)}</li>
            <li>
              Best accuracy on this difficulty:{' '}
              {formatMetricValue(selectedDifficultyRecord.bestAccuracyPercent, '%')}
            </li>
          </ul>
        </article>
      </div>

      <div className="button-row">
        <Link className="button" to={APP_ROUTE_PATHS.game}>
          Back to gameplay shell
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
          Open progress shell
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
          Return home
        </Link>
      </div>
    </section>
  );
}
