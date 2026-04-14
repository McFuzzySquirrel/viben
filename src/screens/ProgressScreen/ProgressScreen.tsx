import { Link } from 'react-router-dom';
import { StatusBadge } from '@features/game/components';
import { useDifficultySelection } from '@features/settings';
import { loadProgressionState } from '@shared/persistence';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function formatNullableValue(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

export function ProgressScreen() {
  const { persistenceIssues, persistenceStatus, selectedDifficulty } = useDifficultySelection();
  const progressionSnapshot = loadProgressionState();
  const difficultyRecords = Object.values(progressionSnapshot.save.difficultyRecords);

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Progress shell</p>
          <h2>Keep local-only progression visible without committing to final reports yet.</h2>
          <p className="screen__lead">
            This routed screen now exposes the progression contracts, local-save status, and
            difficulty breakdowns that later agents can enrich with real run history.
          </p>

          <div className="status-row" aria-label="Progression shell status">
            <StatusBadge label={`Save status: ${persistenceStatus}`} tone={persistenceIssues.length > 0 ? 'warning' : 'success'} />
            <StatusBadge label={`Selected difficulty: ${selectedDifficulty.label}`} tone="info" />
            <StatusBadge label="Local-only data" tone="neutral" />
          </div>
        </div>

        <aside className="panel">
          <h3>Privacy guardrails</h3>
          <ul className="feature-list">
            <li>Progress data remains on this device only.</li>
            <li>No raw microphone recordings or personal profile fields are stored.</li>
            <li>Future comparison views can build on this layout without adding accounts.</li>
          </ul>
        </aside>
      </div>

      <div className="metric-grid">
        <article className="panel metric-card">
          <p>Stored runs</p>
          <strong>{progressionSnapshot.save.runHistory.length}</strong>
        </article>
        <article className="panel metric-card">
          <p>Milestones</p>
          <strong>{progressionSnapshot.save.milestones.length}</strong>
        </article>
        <article className="panel metric-card">
          <p>Persistence issues</p>
          <strong>{persistenceIssues.length}</strong>
        </article>
      </div>

      <div className="screen-grid">
        {difficultyRecords.map((record) => (
          <article className="panel" key={record.difficultyId}>
            <div className="panel__header">
              <h3>{record.difficultyId}</h3>
              <StatusBadge label={record.isUnlocked ? 'Unlocked' : 'Locked'} tone={record.isUnlocked ? 'success' : 'warning'} />
            </div>

            <dl className="detail-list">
              <div>
                <dt>Runs played</dt>
                <dd>{record.runCount}</dd>
              </div>
              <div>
                <dt>Completed runs</dt>
                <dd>{record.completedRunCount}</dd>
              </div>
              <div>
                <dt>Best score</dt>
                <dd>{formatNullableValue(record.bestScore)}</dd>
              </div>
              <div>
                <dt>Best stars</dt>
                <dd>{formatNullableValue(record.bestStars)}</dd>
              </div>
              <div>
                <dt>Best accuracy</dt>
                <dd>{formatNullableValue(record.bestAccuracyPercent, '%')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="screen-grid">
        <article className="panel">
          <h3>Recovery and handoff</h3>
          {persistenceIssues.length > 0 ? (
            <ul className="feature-list">
              {persistenceIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="panel__supporting-copy">
              No persistence recovery issues are currently reported by the local progression
              contracts.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Next route connections</h3>
          <p className="panel__supporting-copy">
            Results can link back here for comparison summaries, and Home can continue to surface
            the player&apos;s selected difficulty.
          </p>
        </article>
      </div>

      <div className="button-row">
        <Link className="button" to={APP_ROUTE_PATHS.home}>
          Back to home
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.game}>
          Open gameplay shell
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.results}>
          Open results shell
        </Link>
      </div>
    </section>
  );
}
