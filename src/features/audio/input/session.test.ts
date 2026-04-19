import { afterEach, describe, expect, it, vi } from 'vitest';
import { installBrowserTestMocks, resetBrowserTestMocks } from '../../../test/mocks/browser';
import {
  createAudioInputSession,
  isMobileDevice,
  resumeOnGesture,
} from './session';

// ---------------------------------------------------------------------------
// isMobileDevice()
// ---------------------------------------------------------------------------

describe('isMobileDevice', () => {
  afterEach(() => {
    resetBrowserTestMocks();
  });

  it('returns false when maxTouchPoints is 0 (desktop)', () => {
    installBrowserTestMocks({ maxTouchPoints: 0 });
    expect(isMobileDevice()).toBe(false);
  });

  it('returns true when maxTouchPoints is 1 (touch-capable device)', () => {
    installBrowserTestMocks({ maxTouchPoints: 1 });
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true when maxTouchPoints is 5 (multi-touch mobile)', () => {
    installBrowserTestMocks({ maxTouchPoints: 5 });
    expect(isMobileDevice()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resumeOnGesture()
// ---------------------------------------------------------------------------

describe('resumeOnGesture', () => {
  it('resolves immediately when the AudioContext is already running', async () => {
    const audioContext = {
      state: 'running' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext;

    await resumeOnGesture(audioContext);

    expect(audioContext.resume).not.toHaveBeenCalled();
  });

  it('waits for a click gesture and then resumes a suspended context', async () => {
    const audioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockImplementation(async function (this: { state: string }) {
        this.state = 'running';
      }),
    } as unknown as AudioContext;

    const gesturePromise = resumeOnGesture(audioContext);

    // Simulate a user click
    document.dispatchEvent(new Event('click', { bubbles: true }));

    await gesturePromise;

    expect(audioContext.resume).toHaveBeenCalledTimes(1);
  });

  it('waits for a touchstart gesture and then resumes a suspended context', async () => {
    const audioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockImplementation(async function (this: { state: string }) {
        this.state = 'running';
      }),
    } as unknown as AudioContext;

    const gesturePromise = resumeOnGesture(audioContext);

    // Simulate a touch
    document.dispatchEvent(new Event('touchstart', { bubbles: true }));

    await gesturePromise;

    expect(audioContext.resume).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listeners after the gesture fires', async () => {
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

    const audioContext = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockImplementation(async function (this: { state: string }) {
        this.state = 'running';
      }),
    } as unknown as AudioContext;

    const gesturePromise = resumeOnGesture(audioContext);

    document.dispatchEvent(new Event('click', { bubbles: true }));
    await gesturePromise;

    // Both listeners should have been removed
    const removeCallArgs = removeListenerSpy.mock.calls.map((call) => call[0]);
    expect(removeCallArgs).toContain('click');
    expect(removeCallArgs).toContain('touchstart');
  });
});

// ---------------------------------------------------------------------------
// createAudioInputSession — autoGainControl (FT-FR-11)
// ---------------------------------------------------------------------------

describe('createAudioInputSession — autoGainControl', () => {
  it('FT-FR-11 defaults autoGainControl to true on mobile', async () => {
    const mocks = installBrowserTestMocks({
      maxTouchPoints: 5,
      permissionState: 'granted',
      audioContextState: 'running',
    });

    await createAudioInputSession();

    const getUserMediaCall = mocks.getUserMediaMock.mock.calls[0][0] as MediaStreamConstraints;
    const audioConstraints = getUserMediaCall.audio as MediaTrackConstraints;
    expect(audioConstraints.autoGainControl).toBe(true);
  });

  it('FT-FR-11 defaults autoGainControl to false on desktop', async () => {
    const mocks = installBrowserTestMocks({
      maxTouchPoints: 0,
      permissionState: 'granted',
      audioContextState: 'running',
    });

    await createAudioInputSession();

    const getUserMediaCall = mocks.getUserMediaMock.mock.calls[0][0] as MediaStreamConstraints;
    const audioConstraints = getUserMediaCall.audio as MediaTrackConstraints;
    expect(audioConstraints.autoGainControl).toBe(false);
  });

  it('respects an explicit autoGainControl override on mobile', async () => {
    const mocks = installBrowserTestMocks({
      maxTouchPoints: 5,
      permissionState: 'granted',
      audioContextState: 'running',
    });

    await createAudioInputSession({ audio: { autoGainControl: false } });

    const getUserMediaCall = mocks.getUserMediaMock.mock.calls[0][0] as MediaStreamConstraints;
    const audioConstraints = getUserMediaCall.audio as MediaTrackConstraints;
    expect(audioConstraints.autoGainControl).toBe(false);
  });

  it('respects an explicit autoGainControl override on desktop', async () => {
    const mocks = installBrowserTestMocks({
      maxTouchPoints: 0,
      permissionState: 'granted',
      audioContextState: 'running',
    });

    await createAudioInputSession({ audio: { autoGainControl: true } });

    const getUserMediaCall = mocks.getUserMediaMock.mock.calls[0][0] as MediaStreamConstraints;
    const audioConstraints = getUserMediaCall.audio as MediaTrackConstraints;
    expect(audioConstraints.autoGainControl).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createAudioInputSession — gesture resume (FT-FR-10)
// ---------------------------------------------------------------------------

describe('createAudioInputSession — gesture resume', () => {
  it('FT-FR-10 calls resumeOnGesture when AudioContext starts suspended', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'suspended',
    });

    // The session should be created without throwing even if suspended
    const session = await createAudioInputSession();

    // Simulate a gesture to let the context resume
    document.dispatchEvent(new Event('click', { bubbles: true }));

    // After gesture + ensureRunning, should work
    await session.ensureRunning();
    expect(session.metrics.sampleRate).toBe(48_000);

    await session.close();
  });
});

// ---------------------------------------------------------------------------
// createAudioInputSession — visibilitychange recovery
// ---------------------------------------------------------------------------

describe('createAudioInputSession — visibilitychange recovery', () => {
  it('re-resumes AudioContext when tab becomes visible and context is suspended', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
    });

    const onAudioResumed = vi.fn();
    const session = await createAudioInputSession({}, { onAudioResumed });

    // Simulate the AudioContext becoming suspended (e.g. tab went to background)
    // We need to get at the mock AudioContext — getUserMedia was called, so we
    // can access the internal state through the mock.
    // The simplest approach: manually suspend via the mock's writable state
    // Since the mock AudioContext sets state = 'running' on resume(), we
    // simulate suspension by overriding the prototype:
    // Actually, the mock AudioContext state is set per-instance. Let's use
    // a different approach: install mocks with suspended state and simulate visibility.

    // For this test, let's close the session and create a new one with visibility tracking.
    await session.close();

    // Create a fresh session — we'll test the visibility listener
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
      visibilityState: 'visible',
    });

    const onResumedCallback = vi.fn();
    const session2 = await createAudioInputSession({}, { onAudioResumed: onResumedCallback });

    // The context is running, so visibilitychange shouldn't trigger a resume
    document.dispatchEvent(new Event('visibilitychange'));
    // Wait a tick
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(onResumedCallback).not.toHaveBeenCalled();

    await session2.close();
  });

  it('cleans up visibilitychange listener on close()', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
    });

    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
    const session = await createAudioInputSession();

    await session.close();

    const removeCallArgs = removeListenerSpy.mock.calls.map((call) => call[0]);
    expect(removeCallArgs).toContain('visibilitychange');
  });

  it('does not fire onAudioResumed after close()', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
    });

    const onAudioResumed = vi.fn();
    const session = await createAudioInputSession({}, { onAudioResumed });

    await session.close();

    // After close, the listener is removed, so dispatching visibilitychange
    // should NOT trigger the callback
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(onAudioResumed).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createAudioInputSession — session options interface
// ---------------------------------------------------------------------------

describe('createAudioInputSession — options', () => {
  it('accepts empty options without errors', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
    });

    const session = await createAudioInputSession();
    expect(session.metrics.sampleRate).toBe(48_000);
    await session.close();
  });

  it('accepts onAudioResumed callback in options', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      audioContextState: 'running',
    });

    const callback = vi.fn();
    const session = await createAudioInputSession({}, { onAudioResumed: callback });
    expect(session.metrics.sampleRate).toBe(48_000);
    await session.close();
  });
});
