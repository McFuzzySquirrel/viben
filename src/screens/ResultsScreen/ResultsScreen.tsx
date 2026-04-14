import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { type GameResultsRouteState, type GameRunSummary, toProgressionRunSummary } from '@features/game';
import { StatusBadge } from '@features/game/components';
import {
  buildLocalRunComparison,
  getBestRunSummary,
  getLatestRunSummary,
  type RunResultSummary,
} from '@features/progression';
import { getDifficultyDefinition } from '@shared/config/difficulty';
import { loadProgressionState, persistRunSummary } from '@shared/persistence';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function formatMetricValue(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatOutcome(outcome: RunResultSummary['outcome']) {
  switch (outcome) {
    case 'completed':
      return 'Mission complete';
    case 'failed':
      return 'Mission failed';
    default:
      return 'Run abandoned';
  }
}

function formatEndReason(endReason: string | null) {
  if (!endReason) {
    return 'Not captured';
  }

  return endReason
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDelta(value: number | null, suffix = '') {
  if (value === null) {
    return 'First local benchmark';
  }

  if (value === 0) {
    return `Even${suffix ? ` ${suffix.trim()}` : ''}`;
  }

  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export function ResultsScreen() {
  const location = useLocation();
  const routeSummary = getRouteRunSummary(location.state);
  const routeRun = useMemo(() => (routeSummary ? toProgressionRunSummary(routeSummary) : null), [routeSummary]);
  const [progressionSnapshot, setProgressionSnapshot] = useState(() => loadProgressionState());

  useEffect(() => {
    if (!routeRun) {
      return;
    }

    setProgressionSnapshot((current) => {
      if (current.save.runHistory.some((run) => run.id === routeRun.id)) {
        return current;
      }

      return persistRunSummary(routeRun);
    });
  }, [routeRun]);

  const effectiveRunHistory = useMemo(
    () =>
      routeRun
        ? [routeRun, ...progressionSnapshot.save.runHistory.filter((run) => run.id !== routeRun.id)]
        : progressionSnapshot.save.runHistory,
    [progressionSnapshot.save.runHistory, routeRun],
  );
  const latestRun = routeRun ?? getLatestRunSummary(effectiveRunHistory);
  const selectedDifficulty = getDifficultyDefinition(
    latestRun?.difficultyId ?? progressionSnapshot.save.selectedDifficultyId,
  );
  const comparison = latestRun
    ? buildLocalRunComparison(effectiveRunHistory, {
        difficultyId: latestRun.difficultyId,
        limit: 2,
      })
    : null;
  const latestComparisonEntry = comparison?.entries[0] ?? null;
  const previousRun = comparison?.entries[1] ?? null;
  const bestDifficultyRun = getBestRunSummary(effectiveRunHistory, selectedDifficulty.id);
  const resultMetrics = latestRun
    ? [
        { label: 'Score', value: String(latestRun.score) },
        { label: 'Rating', value: `${latestRun.stars} / 3 stars` },
        { label: 'Elapsed', value: formatDuration(latestRun.durationMs) },
        {
          label: 'Accuracy',
          value: formatMetricValue(latestRun.performance.accuracyPercent, '%'),
        },
      ]
    : [
        { label: 'Score', value: '—' },
        { label: 'Rating', value: '—' },
        { label: 'Elapsed', value: '—' },
        { label: 'Accuracy', value: '—' },
      ];

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Run results</p>
          <h2>{latestRun ? `${formatOutcome(latestRun.outcome)} review` : 'No local run summary yet.'}</h2>
          <p className="screen__lead">
            Review the latest score, note performance, and local comparison data without leaving the
            browser or creating an account.
          </p>

          <div className="status-row" aria-label="Results status">
            <StatusBadge
              label={`Save status: ${progressionSnapshot.status}`}
              tone={progressionSnapshot.issues.length > 0 ? 'warning' : 'success'}
            />
            <StatusBadge label={`Difficulty: ${selectedDifficulty.label}`} tone="info" />
            <StatusBadge
              label={latestRun ? `Saved runs: ${progressionSnapshot.save.runHistory.length}` : 'Waiting for first run'}
              tone={latestRun ? 'success' : 'neutral'}
            />
          </div>

          {progressionSnapshot.issues.length > 0 ? (
            <p className="inline-message inline-message--warning" role="alert">
              <strong>Save recovery active.</strong> {progressionSnapshot.issues.join(', ')}
            </p>
          ) : null}
        </div>

        <aside className="panel">
          <h3>Local comparison snapshot</h3>
          {latestRun && latestComparisonEntry ? (
            <ul className="feature-list">
              <li>Outcome: {formatOutcome(latestRun.outcome)}</li>
              <li>Score change: {formatDelta(latestComparisonEntry.scoreDelta)}</li>
              <li>Accuracy change: {formatDelta(latestComparisonEntry.accuracyDeltaPercent, '%')}</li>
              <li>Time on target: {formatDelta(latestComparisonEntry.timeOnTargetDeltaMs, ' ms')}</li>
            </ul>
          ) : (
            <p className="panel__supporting-copy">
              Finish one run to unlock the first local comparison snapshot.
            </p>
          )}
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
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Summary stats</p>
              <h3>Latest run breakdown</h3>
            </div>
            <StatusBadge label={latestRun ? `${latestRun.stars} stars` : 'Awaiting run'} tone="success" />
          </div>

          {latestRun ? (
            <dl className="detail-list">
              <div>
                <dt>Outcome</dt>
                <dd>{formatOutcome(latestRun.outcome)}</dd>
              </div>
              <div>
                <dt>End reason</dt>
                <dd>{formatEndReason(latestRun.endReason)}</dd>
              </div>
              <div>
                <dt>Prompts cleared / shown</dt>
                <dd>
                  {formatMetricValue(latestRun.performance.promptsCleared)} /{' '}
                  {formatMetricValue(latestRun.performance.promptsPresented)}
                </dd>
              </div>
              <div>
                <dt>Hazards faced</dt>
                <dd>{latestRun.hazardsFaced}</dd>
              </div>
              <div>
                <dt>Boosts caught</dt>
                <dd>{latestRun.boostsCaught}</dd>
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
              Start and finish a run to populate the first real mission summary here.
            </p>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Best on difficulty</p>
              <h3>{selectedDifficulty.label} local best</h3>
            </div>
            <StatusBadge
              label={bestDifficultyRun ? `${bestDifficultyRun.score} best score` : 'No best yet'}
              tone="info"
            />
          </div>

          {bestDifficultyRun ? (
            <dl className="detail-list">
              <div>
                <dt>Best score</dt>
                <dd>{bestDifficultyRun.score}</dd>
              </div>
              <div>
                <dt>Best rating</dt>
                <dd>{bestDifficultyRun.stars} / 3 stars</dd>
              </div>
              <div>
                <dt>Best accuracy</dt>
                <dd>{formatMetricValue(bestDifficultyRun.performance.accuracyPercent, '%')}</dd>
              </div>
              <div>
                <dt>Best time on target</dt>
                <dd>{formatMetricValue(bestDifficultyRun.performance.timeOnTargetMs, ' ms')}</dd>
              </div>
              <div>
                <dt>Previous comparable run</dt>
                <dd>
                  {previousRun
                    ? `${previousRun.score} score • ${formatOutcome(previousRun.outcome)}`
                    : 'This is the first saved run on this difficulty.'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="panel__supporting-copy">
              No run has been saved on this difficulty yet.
            </p>
          )}
        </article>
      </div>

      <div className="button-row">
        <Link className="button" state={{ autoStart: true }} to={APP_ROUTE_PATHS.game}>
          Retry run
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.progress}>
          Compare local runs
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
          Return home
        </Link>
      </div>
    </section>
  );
}

function getRouteRunSummary(state: unknown): GameRunSummary | null {
  if (!state || typeof state !== 'object' || !('runSummary' in state)) {
    return null;
  }

  return (state as GameResultsRouteState).runSummary;
}
