import type { PitchTargetMatchState } from '@features/audio';
import type { RocketFlightMode } from '@features/game/engine';

interface RocketSpriteProps {
  /** Current flight mode from the game engine */
  mode: RocketFlightMode | null;
  /** Current pitch match state — drives flame color */
  matchState: PitchTargetMatchState;
  /** Whether a boost event is currently active */
  boostActive: boolean;
  /** Optional className for positioning */
  className?: string;
}

function getModeClass(mode: RocketFlightMode | null): string {
  switch (mode) {
    case 'steady':
      return 'rocket-sprite--steady';
    case 'boosting':
      return 'rocket-sprite--boosting';
    case 'drifting':
      return 'rocket-sprite--drifting';
    case 'critical':
      return 'rocket-sprite--critical';
    case 'offline':
      return 'rocket-sprite--offline';
    default:
      return '';
  }
}

function getMatchClass(matchState: PitchTargetMatchState): string {
  switch (matchState) {
    case 'correct':
      return 'rocket-sprite--correct';
    case 'incorrect':
      return 'rocket-sprite--incorrect';
    default:
      return 'rocket-sprite--silence';
  }
}

function getFlameClass(matchState: PitchTargetMatchState): string {
  switch (matchState) {
    case 'correct':
      return 'rocket-sprite__flame--large';
    case 'incorrect':
      return 'rocket-sprite__flame--small';
    default:
      return 'rocket-sprite__flame--none';
  }
}

function getModeLabel(mode: RocketFlightMode | null): string {
  switch (mode) {
    case 'steady':
      return 'steady flight';
    case 'boosting':
      return 'boosting';
    case 'drifting':
      return 'drifting';
    case 'critical':
      return 'critical stability';
    case 'offline':
      return 'offline';
    default:
      return 'awaiting launch';
  }
}

export function RocketSprite({
  mode,
  matchState,
  boostActive,
  className,
}: RocketSpriteProps) {
  const classes = [
    'rocket-sprite',
    getModeClass(mode),
    getMatchClass(matchState),
    boostActive ? 'rocket-sprite--boost-active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const flameClass = `rocket-sprite__flame ${getFlameClass(matchState)}`;

  return (
    <svg
      aria-label={`Rocket: ${getModeLabel(mode)}`}
      className={classes}
      fill="none"
      role="img"
      viewBox="0 0 32 52"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flame — rendered first so it layers behind the body */}
      <g className={flameClass}>
        {/* Outer flame */}
        <path
          className="rocket-sprite__flame-outer"
          d="M11 38 L16 50 L21 38"
        />
        {/* Inner flame core */}
        <path
          className="rocket-sprite__flame-inner"
          d="M13 38 L16 46 L19 38"
        />
      </g>

      {/* Fins */}
      <path
        className="rocket-sprite__fin"
        d="M6 32 L10 26 L10 34 Z"
      />
      <path
        className="rocket-sprite__fin"
        d="M26 32 L22 26 L22 34 Z"
      />

      {/* Body — capsule shape */}
      <rect
        className="rocket-sprite__body"
        height="22"
        rx="4"
        ry="4"
        width="12"
        x="10"
        y="14"
      />

      {/* Nose cone */}
      <path
        className="rocket-sprite__nose"
        d="M10 16 L16 4 L22 16 Z"
      />

      {/* Window porthole */}
      <circle
        className="rocket-sprite__window"
        cx="16"
        cy="22"
        r="3"
      />
    </svg>
  );
}
