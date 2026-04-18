import { useState } from 'react';
import { Link } from 'react-router-dom';
import { selectAudioSetupStatus, useAudioInput } from '@features/audio';
import { StatusBadge } from '@features/game/components';
import { SOLFEGE_NOTE_DEFINITIONS, SOLFEGE_NOTE_IDS, type SolfegeNoteId } from '@shared/config/solfege';
import { saveVoiceProfile } from '@shared/persistence/voice-profile-storage';
import { APP_ROUTE_PATHS } from '@shared/types/routes';
import { CalibrationProgress, NoteCaptureCard } from '@features/calibration/components';
import { useCalibrationCapture } from '@features/calibration/useCalibrationCapture';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNoteLabel(noteId: SolfegeNoteId): string {
  return SOLFEGE_NOTE_DEFINITIONS.find((d) => d.id === noteId)?.label ?? noteId;
}

function formatSetupStage(stage: string): string {
  switch (stage) {
    case 'capturing':
      return 'Mic live and listening';
    case 'ready':
      return 'Permission granted';
    case 'blocked':
      return 'Microphone blocked';
    case 'error':
      return 'Microphone error';
    case 'unsupported':
      return 'Microphone unsupported';
    case 'requesting':
      return 'Browser prompt open';
    default:
      return 'Microphone check pending';
  }
}

function getMicTone(stage: string) {
  if (stage === 'unsupported' || stage === 'blocked' || stage === 'error') return 'danger';
  if (stage === 'ready' || stage === 'capturing') return 'success';
  return 'info';
}

// ---------------------------------------------------------------------------
// CalibrationScreen
// ---------------------------------------------------------------------------

export function CalibrationScreen() {
  const microphone = useAudioInput();
  const setup = selectAudioSetupStatus(microphone.state);
  const calibration = useCalibrationCapture();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const {
    state: calState,
    currentNoteId,
    currentSamples,
    latestSample,
    holdProgress,
    isMonitoring,
    confirmNote,
    skipNote,
    redoNote,
    startCapture,
    buildProfile,
  } = calibration;

  const micReady = setup.stage === 'capturing' || setup.stage === 'ready';

  const capturedCount = SOLFEGE_NOTE_IDS.filter(
    (id) => calState.noteStatuses[id] === 'captured',
  ).length;
  const skippedCount = SOLFEGE_NOTE_IDS.filter(
    (id) => calState.noteStatuses[id] === 'skipped',
  ).length;

  // ── Save handler ────────────────────────────────────────────────────

  const handleSaveProfile = () => {
    const profile = buildProfile();
    if (!profile) return;

    const issue = saveVoiceProfile(profile);
    setSaveStatus(issue ? 'error' : 'saved');
  };

  // ── Determine if all captured (no skips) for save eligibility ──────

  const canSave = calState.isComplete && skippedCount === 0;

  return (
    <section className="screen">
      <div className="hero">
        <div className="hero__copy">
          <p className="screen__eyebrow">Voice calibration</p>
          <h2>Teach the game your singing range, one note at a time.</h2>
          <p className="screen__lead">
            Sing each solfege note and hold it steady for about 1.5 seconds.
            The game records your natural frequency for each note to build a
            personalised voice profile. No raw audio is stored.
          </p>

          <div className="status-row" aria-label="Calibration status summary">
            <StatusBadge label={formatSetupStage(setup.stage)} tone={getMicTone(setup.stage)} />
            <StatusBadge
              label={`Captured: ${capturedCount} / ${SOLFEGE_NOTE_IDS.length}`}
              tone={capturedCount === SOLFEGE_NOTE_IDS.length ? 'success' : 'info'}
            />
            {skippedCount > 0 && (
              <StatusBadge label={`Skipped: ${skippedCount}`} tone="warning" />
            )}
            {saveStatus === 'saved' && (
              <StatusBadge label="Profile saved ✓" tone="success" />
            )}
          </div>

          {/* Microphone guidance */}
          {!micReady && (
            <p className="inline-message inline-message--warning" role="alert">
              <strong>Microphone access is required.</strong>{' '}
              {setup.stage === 'unsupported'
                ? 'Use a secure desktop browser with microphone support.'
                : 'Grant microphone permission to begin calibration.'}
            </p>
          )}

          <div className="button-row">
            {!micReady && (
              <button
                className="button"
                disabled={!setup.canRequestAccess}
                onClick={() => void microphone.requestMicrophoneAccess()}
                type="button"
              >
                {setup.stage === 'capturing' ? 'Refresh microphone' : 'Check microphone'}
              </button>
            )}
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
              Back to home
            </Link>
          </div>
        </div>

        <aside className="panel">
          <h3>How calibration works</h3>
          <ol className="step-list">
            <li>Grant microphone access if the browser asks.</li>
            <li>For each note (Do through Ti), press Start Capture and sing the note steadily.</li>
            <li>Hold for about 1.5 seconds until the progress bar fills.</li>
            <li>Confirm each note to save it, or skip to use defaults.</li>
            <li>Save your profile when all 7 notes are captured.</li>
          </ol>
          <p className="panel__supporting-copy">
            Only frequency statistics are saved. No recordings or raw audio are retained.
          </p>
        </aside>
      </div>

      {micReady && (
        <div className="screen-grid">
          {/* Progress overview */}
          <article className="panel" style={{ gridColumn: '1 / -1' }}>
            <h3>Note progress</h3>
            <CalibrationProgress
              noteStatuses={calState.noteStatuses}
              currentNoteIndex={calState.currentNoteIndex}
              onSelectNote={redoNote}
            />
          </article>

          {/* Active capture card */}
          {!calState.isComplete && currentNoteId && (
            <NoteCaptureCard
              noteId={currentNoteId}
              noteLabel={getNoteLabel(currentNoteId)}
              status={calState.noteStatuses[currentNoteId]}
              holdProgress={holdProgress}
              detectedFrequency={latestSample?.frequencyHz ?? null}
              rms={latestSample?.rms ?? 0}
              isCapturing={calState.noteStatuses[currentNoteId] === 'capturing'}
              onStartCapture={startCapture}
              onConfirm={confirmNote}
              onSkip={skipNote}
            />
          )}

          {/* Live readout panel */}
          <article className="panel">
            <div className="panel__header">
              <div>
                <p className="screen__eyebrow">Live readout</p>
                <h3>Microphone input</h3>
              </div>
              <StatusBadge
                label={isMonitoring ? 'Listening' : 'Idle'}
                tone={isMonitoring ? 'success' : 'info'}
              />
            </div>
            <dl className="detail-list">
              <div>
                <dt>Detected note</dt>
                <dd>{latestSample?.noteId?.toUpperCase() ?? latestSample?.nearestNoteId?.toUpperCase() ?? 'Waiting…'}</dd>
              </div>
              <div>
                <dt>Frequency</dt>
                <dd>{latestSample?.frequencyHz ? `${latestSample.frequencyHz.toFixed(1)} Hz` : '—'}</dd>
              </div>
              <div>
                <dt>Classification</dt>
                <dd>{latestSample?.classification ?? 'Waiting for input'}</dd>
              </div>
              <div>
                <dt>Samples collected</dt>
                <dd>{currentSamples.length}</dd>
              </div>
              <div>
                <dt>Privacy</dt>
                <dd>Audio stays local in the browser. No recordings are stored.</dd>
              </div>
            </dl>
          </article>

          {/* Completion panel */}
          {calState.isComplete && (
            <article className="panel" style={{ gridColumn: '1 / -1' }}>
              <h3>Calibration complete</h3>

              {skippedCount > 0 && (
                <p className="inline-message inline-message--warning">
                  <strong>{skippedCount} note{skippedCount > 1 ? 's were' : ' was'} skipped.</strong>{' '}
                  A full voice profile requires all 7 notes. You can redo skipped notes by clicking
                  them in the progress bar above.
                </p>
              )}

              {canSave && saveStatus !== 'saved' && (
                <p className="inline-message inline-message--success">
                  <strong>All 7 notes captured!</strong> Save your voice profile to use personalised
                  note detection in gameplay.
                </p>
              )}

              {saveStatus === 'saved' && (
                <p className="inline-message inline-message--success" role="status">
                  <strong>Voice profile saved.</strong> The game will use your personalised frequency
                  map for note detection.
                </p>
              )}

              {saveStatus === 'error' && (
                <p className="inline-message inline-message--warning" role="alert">
                  <strong>Save failed.</strong> Check browser storage availability and try again.
                </p>
              )}

              {/* Summary of captured notes */}
              <div className="run-stat-grid" style={{ marginTop: '1rem' }}>
                {SOLFEGE_NOTE_IDS.map((noteId) => {
                  const data = calState.capturedData[noteId];
                  const label = getNoteLabel(noteId);
                  const status = calState.noteStatuses[noteId];

                  return (
                    <article className="run-stat-card" key={noteId}>
                      <span className="run-stat-card__label">{label}</span>
                      {data ? (
                        <strong>{data.medianFrequencyHz.toFixed(1)} Hz</strong>
                      ) : (
                        <strong>{status === 'skipped' ? 'Skipped' : '—'}</strong>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="button-row">
                {canSave && saveStatus !== 'saved' && (
                  <button className="button" onClick={handleSaveProfile} type="button">
                    Save profile
                  </button>
                )}
                <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
                  Back to home
                </Link>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
