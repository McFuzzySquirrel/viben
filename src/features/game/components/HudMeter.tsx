interface HudMeterProps {
  label: string;
  valueText: string;
  percent: number;
  hint?: string;
  tone?: 'neutral' | 'success' | 'warning';
}

function clampPercent(percent: number) {
  return Math.max(0, Math.min(100, percent));
}

export function HudMeter({
  label,
  valueText,
  percent,
  hint,
  tone = 'neutral',
}: HudMeterProps) {
  const normalizedPercent = clampPercent(percent);

  return (
    <div className="hud-meter">
      <div className="hud-meter__header">
        <span>{label}</span>
        <strong>{valueText}</strong>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(normalizedPercent)}
        className="hud-meter__track"
        role="progressbar"
      >
        <span
          className={`hud-meter__fill hud-meter__fill--${tone}`}
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
      {hint ? <p className="hud-meter__hint">{hint}</p> : null}
    </div>
  );
}
