import type { CalibrationNoteStatus } from '../types';

// ---------------------------------------------------------------------------
// NoteCaptureCard — Active capture area for a single calibration note
// ---------------------------------------------------------------------------

interface NoteCaptureCardProps {
  noteId: string;
  noteLabel: string;
  status: CalibrationNoteStatus;
  holdProgress: number;
  detectedFrequency: number | null;
  rms: number;
  isCapturing: boolean;
  onStartCapture: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

function getStatusLabel(status: CalibrationNoteStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'capturing':
      return 'Capturing…';
    case 'captured':
      return 'Captured ✓';
    case 'skipped':
      return 'Skipped —';
  }
}

function getStatusBadgeClass(status: CalibrationNoteStatus): string {
  switch (status) {
    case 'pending':
      return 'status-badge status-badge--info';
    case 'capturing':
      return 'status-badge status-badge--warning';
    case 'captured':
      return 'status-badge status-badge--success';
    case 'skipped':
      return 'status-badge status-badge--warning';
  }
}

/** Rough signal-strength bucket (0–4) from RMS for visual feedback. */
function signalStrengthLevel(rms: number): number {
  if (rms < 0.01) return 0;
  if (rms < 0.03) return 1;
  if (rms < 0.06) return 2;
  if (rms < 0.12) return 3;
  return 4;
}

function signalStrengthLabel(level: number): string {
  switch (level) {
    case 0:
      return 'No signal';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    default:
      return 'Strong';
  }
}

export function NoteCaptureCard({
  noteLabel,
  status,
  holdProgress,
  detectedFrequency,
  rms,
  isCapturing,
  onStartCapture,
  onConfirm,
  onSkip,
}: NoteCaptureCardProps) {
  const holdPercent = Math.round(holdProgress * 100);
  const holdComplete = holdProgress >= 1;
  const sigLevel = signalStrengthLevel(rms);

  return (
    <article className="panel" aria-label={`Calibrate note ${noteLabel}`}>
      <div className="panel__header">
        <div>
          <p className="screen__eyebrow">Current note</p>
          <h3 className="retro-hud retro-glow" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0 }}>
            {noteLabel}
          </h3>
        </div>
        <span className={getStatusBadgeClass(status)} aria-label={`Status: ${getStatusLabel(status)}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Frequency display */}
      <p className="frequency-display retro-hud retro-glow" aria-live="polite" aria-atomic="true">
        {detectedFrequency !== null ? `${detectedFrequency.toFixed(1)} Hz` : '— Hz'}
      </p>

      {/* Signal strength */}
      <div className="status-row" aria-label="Signal strength">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="signal-bar"
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: `${0.5 + i * 0.35}rem`,
              borderRadius: '2px',
              background: i < sigLevel ? 'var(--color-success, #4caf50)' : 'rgba(255, 255, 255, 0.15)',
              transition: 'background 0.15s ease',
            }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">{`Signal strength: ${signalStrengthLabel(sigLevel)}`}</span>
      </div>

      {/* Hold progress bar */}
      <div
        className="hold-progress"
        role="progressbar"
        aria-valuenow={holdPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Hold progress: ${holdPercent}%`}
      >
        <div
          className="hold-progress__fill"
          style={{ width: `${holdPercent}%` }}
        />
      </div>

      <p className="panel__supporting-copy" aria-live="polite">
        {!isCapturing && status === 'pending' && 'Press Start Capture, then sing and hold the note.'}
        {isCapturing && !holdComplete && `Hold the note… ${holdPercent}% captured.`}
        {holdComplete && 'Note captured! Confirm to save or skip to move on.'}
        {status === 'captured' && !isCapturing && 'This note has been captured.'}
        {status === 'skipped' && 'This note was skipped.'}
      </p>

      {/* Action buttons */}
      <div className="button-row">
        {status === 'pending' && !isCapturing && (
          <button className="button" onClick={onStartCapture} type="button">
            Start capture
          </button>
        )}
        {isCapturing && !holdComplete && (
          <button className="button button--secondary" onClick={onSkip} type="button">
            Skip note
          </button>
        )}
        {holdComplete && (
          <>
            <button className="button" onClick={onConfirm} type="button">
              Confirm
            </button>
            <button className="button button--secondary" onClick={onSkip} type="button">
              Skip
            </button>
          </>
        )}
      </div>
    </article>
  );
}
