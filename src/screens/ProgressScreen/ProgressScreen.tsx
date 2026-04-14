import { Link } from 'react-router-dom';
import { StatusBadge } from '@features/game/components';
import { buildLocalRunComparison, getBestRunSummary } from '@features/progression';
import { getDifficultyDefinition } from '@shared/config/difficulty';
import { loadProgressionState } from '@shared/persistence';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

function formatNullableValue(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatOutcome(outcome: 'completed' | 'failed' | 'abandoned') {
  switch (outcome) {
    case 'completed':
      return 'Complete';
    case 'failed':
      return 'Failed';
    default:
      return 'Abandoned';
  }
}

function formatDelta(value: number | null, suffix = '') {
  if (value === null) {
    return 'First local benchmark';
  }

  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export function ProgressScreen() {
  const progressionSnapshot = loadProgressionState();
  const selectedDifficulty = getDifficultyDefinition(progressionSnapshot.save.selectedDifficultyId);
  const difficultyRecords = Object.values(progressionSnapshot.save.difficultyRecords);
  const recentRuns = progressionSnapshot.save.runHistory.slice(0, 5);
  const selectedDifficultyComparison = buildLocalRunComparison(progressionSnapshot.save.runHistory, {
    difficultyId: selectedDifficulty.id,
    limit: 5,
  });
  const overallBestRun = getBestRunSummary(progressionSnapshot.save.runHistory);

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Progress and history</p>
          <h2>Local run history and comparison.</h2>
          <p className="screen__lead">
            Saved run summaries reload after refresh, making it easy to compare recent attempts on
            the same device with no auth or network dependency.
          </p>

          <div className="status-row" aria-label="Progression status">
            <StatusBadge
              label={`Save status: ${progressionSnapshot.status}`}
              tone={progressionSnapshot.issues.length > 0 ? 'warning' : 'success'}
            />
            <StatusBadge label={`Selected difficulty: ${selectedDifficulty.label}`} tone="info" />
            <StatusBadge label={`Stored runs: ${progressionSnapshot.save.runHistory.length}`} tone="success" />
          </div>
        </div>

        <aside className="panel">
          <h3>Privacy guardrails</h3>
          <ul className="feature-list">
            <li>Only gameplay stats are stored locally on this browser.</li>
            <li>No raw audio, account data, or personal profile fields are persisted.</li>
            <li>Comparison stays fully local and refresh-safe for shared-device play.</li>
          </ul>
        </aside>
      </div>

      <div className="metric-grid">
        <article className="panel metric-card">
          <p>Stored runs</p>
          <strong>{progressionSnapshot.save.runHistory.length}</strong>
        </article>
        <article className="panel metric-card">
          <p>Best local score</p>
          <strong>{overallBestRun ? overallBestRun.score : '—'}</strong>
        </article>
        <article className="panel metric-card">
          <p>Best local rating</p>
          <strong>{overallBestRun ? `${overallBestRun.stars} / 3 stars` : '—'}</strong>
        </article>
        <article className="panel metric-card">
          <p>Save issues</p>
          <strong>{progressionSnapshot.issues.length}</strong>
        </article>
      </div>

      <div className="screen-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Recent sessions</p>
              <h3>Recent local runs</h3>
            </div>
            <StatusBadge label={recentRuns.length > 0 ? 'Read back from save' : 'No history yet'} tone="info" />
          </div>

          {recentRuns.length > 0 ? (
            <ul className="feature-list">
              {recentRuns.map((run) => (
                <li key={run.id}>
                  <strong>{run.score}</strong> on {getDifficultyDefinition(run.difficultyId).label} •{' '}
                  {formatOutcome(run.outcome)} • {formatDuration(run.durationMs)} •{' '}
                  {formatNullableValue(run.performance.accuracyPercent, '%')} accuracy •{' '}
                  {formatNullableValue(run.performance.promptsCleared)} /{' '}
                  {formatNullableValue(run.performance.promptsPresented)} prompts • {run.hazardsFaced}{' '}
                  hazards • {run.boostsCaught} boosts
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__supporting-copy">
              Finish a run to start building the first refresh-safe local history list.
            </p>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="screen__eyebrow">Same-device comparison</p>
              <h3>Compare recent {selectedDifficulty.label} runs</h3>
            </div>
            <StatusBadge
              label={selectedDifficultyComparison.entries.length > 1 ? 'Deltas ready' : 'Needs two runs'}
              tone="success"
            />
          </div>

          {selectedDifficultyComparison.entries.length > 0 ? (
            <ul className="feature-list">
              {selectedDifficultyComparison.entries.map((entry) => (
                <li key={entry.runId}>
                  <strong>{entry.score}</strong> score ({entry.stars} stars) •{' '}
                  {formatOutcome(entry.outcome)} • Δ score {formatDelta(entry.scoreDelta)} • Δ accuracy{' '}
                  {formatDelta(entry.accuracyDeltaPercent, '%')} • Δ target time{' '}
                  {formatDelta(entry.timeOnTargetDeltaMs, ' ms')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__supporting-copy">
              Save at least one {selectedDifficulty.label.toLowerCase()} run to unlock this view.
            </p>
          )}
        </article>
      </div>

      <div className="screen-grid">
        {difficultyRecords.map((record) => (
          <article className="panel" key={record.difficultyId}>
            <div className="panel__header">
              <div>
                <p className="screen__eyebrow">Difficulty record</p>
                <h3>{getDifficultyDefinition(record.difficultyId).label}</h3>
              </div>
              <StatusBadge
                label={record.isUnlocked ? 'Unlocked' : 'Locked'}
                tone={record.isUnlocked ? 'success' : 'warning'}
              />
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
              <div>
                <dt>Best target time</dt>
                <dd>{formatNullableValue(record.bestTimeOnTargetMs, ' ms')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="screen-grid">
        <article className="panel">
          <h3>Save recovery</h3>
          {progressionSnapshot.issues.length > 0 ? (
            <ul className="feature-list">
              {progressionSnapshot.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="panel__supporting-copy">
              No save recovery issues were detected when reloading local run history.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Next comparison checks</h3>
          <ul className="feature-list">
            <li>Verify repeated runs keep history sorted newest-first.</li>
            <li>Verify refresh still restores recent runs and difficulty records.</li>
            <li>Verify failed, abandoned, and completed runs all read back safely.</li>
          </ul>
        </article>
      </div>

      <div className="button-row">
        <Link className="button" to={APP_ROUTE_PATHS.home}>
          Back to home
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.game}>
          Start another run
        </Link>
        <Link className="button button--secondary" to={APP_ROUTE_PATHS.results}>
          Open latest results
        </Link>
      </div>
    </section>
  );
}
