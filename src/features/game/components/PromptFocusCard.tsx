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
    <article aria-labelledby="phase-one-prompt-heading" className="panel prompt-card">
      <div className="prompt-card__header">
        <div>
          <p className="screen__eyebrow">Current note prompt</p>
          <h3 id="phase-one-prompt-heading">Focus on one target at a time</h3>
        </div>
        <StatusBadge label={feedbackLabel} tone={getMatchTone(matchState)} />
      </div>

      <p className="prompt-card__solfege">{promptLabel}</p>
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
