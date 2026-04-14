import type { GameplayEventInstance, RocketFlightMode } from '../engine';
import { StatusBadge } from './StatusBadge';

interface RocketFlightCardProps {
  altitudePercent: number;
  altitudeText: string;
  rocketMode: RocketFlightMode | null;
  activeEvent: GameplayEventInstance | null;
  hazardsTriggered: number;
  boostsTriggered: number;
}

function clampPercent(percent: number) {
  return Math.max(0, Math.min(100, percent));
}

function formatRocketMode(rocketMode: RocketFlightMode | null) {
  switch (rocketMode) {
    case 'boosting':
      return 'Rocket boosting';
    case 'drifting':
      return 'Rocket drifting';
    case 'critical':
      return 'Stability critical';
    case 'offline':
      return 'Rocket offline';
    case 'steady':
      return 'Rocket steady';
    default:
      return 'Awaiting launch';
  }
}

function getRocketModeTone(rocketMode: RocketFlightMode | null) {
  switch (rocketMode) {
    case 'boosting':
      return 'success';
    case 'drifting':
    case 'critical':
      return 'warning';
    case 'offline':
      return 'danger';
    default:
      return 'info';
  }
}

function getEventCopy(activeEvent: GameplayEventInstance | null) {
  if (!activeEvent) {
    return {
      label: '☄️/✨ Clear sky',
      detail: 'No hazard or boost is active right now. Keep holding the prompt to keep climbing.',
      tone: 'info' as const,
    };
  }

  if (activeEvent.kind === 'hazard') {
    return {
      label: `☄️ Hazard: ${activeEvent.label}`,
      detail: 'A hazard is active. Strong note matching helps limit the setback.',
      tone: 'warning' as const,
    };
  }

  return {
    label: `✨ Boost: ${activeEvent.label}`,
    detail: 'A boost is active. Stay on the prompt to cash in extra lift and score.',
    tone: 'success' as const,
  };
}

export function RocketFlightCard({
  altitudePercent,
  altitudeText,
  rocketMode,
  activeEvent,
  hazardsTriggered,
  boostsTriggered,
}: RocketFlightCardProps) {
  const normalizedAltitude = clampPercent(altitudePercent);
  const eventCopy = getEventCopy(activeEvent);

  return (
    <article aria-labelledby="rocket-flight-heading" className="panel rocket-flight-card">
      <div className="panel__header">
        <div>
          <p className="screen__eyebrow">Rocket climb</p>
          <h3 id="rocket-flight-heading">Watch the moon progress and live sky events</h3>
        </div>
        <StatusBadge label={formatRocketMode(rocketMode)} tone={getRocketModeTone(rocketMode)} />
      </div>

      <div className="rocket-flight-card__layout">
        <div
          aria-label="Rocket altitude track"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(normalizedAltitude)}
          className="rocket-track"
          role="progressbar"
        >
          <span aria-hidden="true" className="rocket-track__moon">
            🌙
          </span>
          <span aria-hidden="true" className="rocket-track__stars">
            ✦
          </span>
          <span
            aria-hidden="true"
            className="rocket-track__rocket"
            style={{ bottom: `calc(${normalizedAltitude}% - 1.3rem)` }}
          >
            🚀
          </span>
          <span className="rocket-track__trail" style={{ height: `${normalizedAltitude}%` }} />
        </div>

        <div className="rocket-flight-card__summary">
          <p className="rocket-flight-card__altitude">{altitudeText}</p>
          <p className="rocket-flight-card__caption">Climb higher by staying on the current solfege note.</p>

          <div className="rocket-flight-card__event">
            <StatusBadge label={eventCopy.label} tone={eventCopy.tone} />
            <p>{eventCopy.detail}</p>
          </div>

          <dl className="detail-list rocket-flight-card__counts">
            <div>
              <dt>Hazards faced</dt>
              <dd>{hazardsTriggered}</dd>
            </div>
            <div>
              <dt>Boosts caught</dt>
              <dd>{boostsTriggered}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
