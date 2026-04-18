import { SOLFEGE_NOTE_DEFINITIONS, SOLFEGE_NOTE_IDS, type SolfegeNoteId } from '@shared/config/solfege';
import type { CalibrationNoteStatus } from '../types';

// ---------------------------------------------------------------------------
// CalibrationProgress — Horizontal progress row of 7 solfege note badges
// ---------------------------------------------------------------------------

interface CalibrationProgressProps {
  noteStatuses: Record<SolfegeNoteId, CalibrationNoteStatus>;
  currentNoteIndex: number;
  onSelectNote?: (noteId: SolfegeNoteId) => void;
}

function getStatusSymbol(status: CalibrationNoteStatus): string {
  switch (status) {
    case 'captured':
      return '✓';
    case 'skipped':
      return '—';
    case 'capturing':
      return '●';
    default:
      return '○';
  }
}

function getStatusAriaLabel(label: string, status: CalibrationNoteStatus): string {
  switch (status) {
    case 'captured':
      return `${label}: captured`;
    case 'skipped':
      return `${label}: skipped`;
    case 'capturing':
      return `${label}: capturing now`;
    default:
      return `${label}: pending`;
  }
}

function getNoteLabel(noteId: SolfegeNoteId): string {
  return SOLFEGE_NOTE_DEFINITIONS.find((d) => d.id === noteId)?.label ?? noteId;
}

export function CalibrationProgress({
  noteStatuses,
  currentNoteIndex,
  onSelectNote,
}: CalibrationProgressProps) {
  return (
    <nav className="calibration-progress" aria-label="Calibration note progress">
      {SOLFEGE_NOTE_IDS.map((noteId, index) => {
        const status = noteStatuses[noteId];
        const label = getNoteLabel(noteId);
        const isCurrent = index === currentNoteIndex;
        const isClickable =
          onSelectNote && (status === 'captured' || status === 'skipped');

        const classes = [
          'calibration-note',
          `calibration-note--${status}`,
          isCurrent ? 'calibration-note--current' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const ariaLabel = getStatusAriaLabel(label, status);

        if (isClickable) {
          return (
            <button
              key={noteId}
              className={classes}
              onClick={() => onSelectNote(noteId)}
              type="button"
              aria-label={`${ariaLabel} — click to redo`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span aria-hidden="true">{getStatusSymbol(status)}</span>
              <span>{label}</span>
            </button>
          );
        }

        return (
          <span
            key={noteId}
            className={classes}
            role="listitem"
            aria-label={ariaLabel}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span aria-hidden="true">{getStatusSymbol(status)}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </nav>
  );
}
