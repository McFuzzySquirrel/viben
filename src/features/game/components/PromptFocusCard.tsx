import type { PitchTargetMatchState } from '@features/audio';
import { StatusBadge } from './StatusBadge';

interface PromptFocusCardProps {
  promptLabel: string;
  promptScientificPitch: string;
  matchState: PitchTargetMatchState;
  feedbackLabel: string;
  feedbackDetail: string;
  detectedLabel: string;
  classificationLabel: string;
}

function getMatchTone(matchState: PitchTargetMatchState) {
  switch (matchState) {
    case 'correct':
      return 'success';
    case 'incorrect':
      return 'warning';
    default:
      return 'info';
  }
}

function getMatchSymbol(matchState: PitchTargetMatchState) {
  switch (matchState) {
    case 'correct':
      return '✓';
    case 'incorrect':
      return '✗';
    default:
      return '⊘';
  }
}

function getMatchStateLabel(matchState: PitchTargetMatchState) {
  switch (matchState) {
    case 'correct':
      return 'Correct note';
    case 'incorrect':
      return 'Wrong note';
    default:
      return 'Need input';
  }
}

function getSolfegeGlowClass(matchState: PitchTargetMatchState) {
  switch (matchState) {
    case 'correct':
      return 'prompt-card__solfege--correct';
    case 'incorrect':
      return 'prompt-card__solfege--incorrect';
    default:
      return 'prompt-card__solfege--waiting';
  }
}

function getSymbolClass(matchState: PitchTargetMatchState) {
  switch (matchState) {
    case 'correct':
      return 'prompt-card__symbol prompt-card__symbol--correct';
    case 'incorrect':
      return 'prompt-card__symbol prompt-card__symbol--incorrect';
    default:
      return 'prompt-card__symbol prompt-card__symbol--waiting';
  }
}

export function PromptFocusCard({
  promptLabel,
  promptScientificPitch,
  matchState,
  feedbackLabel,
  feedbackDetail,
  detectedLabel,
  classificationLabel,
}: PromptFocusCardProps) {
  return (
    <article aria-labelledby="prompt-focus-heading" className="panel prompt-card">
      <div className="prompt-card__header">
        <div>
          <p className="screen__eyebrow">Current note prompt</p>
          <h3 id="prompt-focus-heading">Sing this note now</h3>
        </div>
        <StatusBadge label={feedbackLabel} tone={getMatchTone(matchState)} />
      </div>

      <div aria-live="polite" aria-atomic="true">
        <p className={`prompt-card__solfege ${getSolfegeGlowClass(matchState)}`}>
          <span aria-hidden="true" className={getSymbolClass(matchState)}>
            {getMatchSymbol(matchState)}
          </span>
          <span>{promptLabel}</span>
        </p>
        <p className="sr-only">{getMatchStateLabel(matchState)}: sing {promptLabel}</p>
      </div>
      <p className="prompt-card__pitch">{promptScientificPitch} target window</p>

      <p aria-live="polite" className="prompt-card__feedback">
        {feedbackDetail}
      </p>

      <dl className="detail-list">
        <div>
          <dt>Detected note</dt>
          <dd>{detectedLabel}</dd>
        </div>
        <div>
          <dt>Input status</dt>
          <dd>{classificationLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
