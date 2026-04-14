import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';
import { DEFAULT_SOLFEGE_WINDOWS } from '@shared/config/solfege';
import { useMicrophoneInput, usePitchMonitor } from '@features/audio';

export function GameScreen() {
  const microphone = useMicrophoneInput();
  const pitchMonitor = usePitchMonitor(microphone.session);

  return (
    <section className="screen">
      <p className="screen__eyebrow">Game shell</p>
      <h2>Gameplay route placeholder</h2>
      <p className="screen__lead">
        The active run surface is reserved for microphone setup, prompt logic, rocket simulation,
        and HUD systems in later Phase 1 and Phase 2 work.
      </p>

      <div className="screen-grid">
        <article className="panel">
          <h3>Audio foundation handoff</h3>
          <ul className="feature-list">
            <li>Support state: {microphone.state.support.isSupported ? 'supported' : 'blocked'}.</li>
            <li>Permission state: {microphone.state.permission}.</li>
            <li>Readiness state: {microphone.state.readiness}.</li>
            <li>
              Latest pitch classification:{' '}
              {pitchMonitor.latestSample?.classification ?? 'waiting-for-audio'}.
            </li>
          </ul>
        </article>

        <article className="panel">
          <h3>Minimal audio probe</h3>
          <p>
            This Phase 1 hook wires the extracted microphone and pitch modules into the active game
            route without shipping the final mic-check UX.
          </p>
          {microphone.state.lastError ? (
            <p role="alert">{microphone.state.lastError.message}</p>
          ) : (
            <p>Microphone analysis stays local-only and does not store recordings or raw buffers.</p>
          )}
          <div className="button-row">
            <button className="button" onClick={() => void microphone.requestMicrophoneAccess()} type="button">
              {microphone.state.isCapturing ? 'Restart audio capture' : 'Request microphone access'}
            </button>
            <button
              className="button button--secondary"
              onClick={() => void microphone.stopCapture()}
              type="button"
            >
              Stop capture
            </button>
          </div>
          <ul className="feature-list">
            <li>Frame size: {microphone.state.captureMetrics?.frameSize ?? 'n/a'} samples.</li>
            <li>Sample rate: {microphone.state.captureMetrics?.sampleRate ?? 'n/a'} Hz.</li>
            <li>Detected note: {pitchMonitor.latestSample?.noteId ?? 'n/a'}.</li>
            <li>
              Detected frequency:{' '}
              {pitchMonitor.latestSample?.frequencyHz
                ? `${pitchMonitor.latestSample.frequencyHz.toFixed(1)} Hz`
                : 'n/a'}
              .
            </li>
          </ul>
        </article>

        <article className="panel">
          <h3>Shared solfege windows</h3>
          <ul className="feature-list">
            {DEFAULT_SOLFEGE_WINDOWS.map((window) => (
              <li key={window.id}>
                <strong>{window.label}</strong> ({window.scientificPitch}) {window.minFrequencyHz.toFixed(1)}-
                {window.maxFrequencyHz.toFixed(1)} Hz
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Phase 1 placeholder actions</h3>
          <div className="button-row">
            <Link className="button" to={APP_ROUTE_PATHS.results}>
              Review placeholder results
            </Link>
            <Link className="button button--secondary" to={APP_ROUTE_PATHS.home}>
              Return home
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
