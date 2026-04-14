import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMicrophoneInput } from './useMicrophoneInput';
import { installBrowserTestMocks } from '../../../test/mocks/browser';

function MicrophoneHarness() {
  const microphone = useMicrophoneInput();

  return (
    <section>
      <p>permission:{microphone.state.permission}</p>
      <p>readiness:{microphone.state.readiness}</p>
      <p>capturing:{String(microphone.state.isCapturing)}</p>
      <p>blocked:{microphone.state.blockedReason ?? 'none'}</p>
      <p>
        metrics:
        {microphone.state.captureMetrics
          ? `${microphone.state.captureMetrics.frameSize}@${microphone.state.captureMetrics.sampleRate}`
          : 'none'}
      </p>
      <p>error:{microphone.state.lastError?.message ?? 'none'}</p>

      <button onClick={() => void microphone.requestMicrophoneAccess()} type="button">
        request microphone access
      </button>
      <button onClick={() => void microphone.stopCapture()} type="button">
        stop microphone capture
      </button>
    </section>
  );
}

describe('useMicrophoneInput', () => {
  it('AC-04 requests microphone access and exposes live capture metrics without a reload', async () => {
    const browserMocks = installBrowserTestMocks({
      permissionState: 'prompt',
      audioContextState: 'suspended',
    });

    render(<MicrophoneHarness />);

    expect(await screen.findByText('permission:prompt')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'request microphone access' }));

    await waitFor(() => {
      expect(screen.getByText('permission:granted')).toBeInTheDocument();
      expect(screen.getByText('readiness:capturing')).toBeInTheDocument();
      expect(screen.getByText('capturing:true')).toBeInTheDocument();
      expect(screen.getByText('metrics:2048@48000')).toBeInTheDocument();
    });

    expect(browserMocks.getUserMediaMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'stop microphone capture' }));

    await waitFor(() => {
      expect(screen.getByText('readiness:ready')).toBeInTheDocument();
      expect(screen.getByText('capturing:false')).toBeInTheDocument();
      expect(screen.getByText('metrics:none')).toBeInTheDocument();
    });

    expect(browserMocks.getActiveTrack()?.readyState).toBe('ended');
  });

  it('AC-02 moves into a clear blocked state when the browser denies microphone permission', async () => {
    installBrowserTestMocks({
      permissionState: 'prompt',
      getUserMediaError: new DOMException('Denied by browser', 'NotAllowedError'),
    });

    render(<MicrophoneHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'request microphone access' }));

    await waitFor(() => {
      expect(screen.getByText('permission:denied')).toBeInTheDocument();
      expect(screen.getByText('readiness:blocked')).toBeInTheDocument();
      expect(screen.getByText('capturing:false')).toBeInTheDocument();
    });

    expect(screen.getByText(/Microphone access was denied/)).toBeInTheDocument();
  });

  it('NF-06 enters a blocked unsupported state when browser audio APIs are missing', async () => {
    installBrowserTestMocks({
      hasMediaDevices: false,
      hasWebAudio: false,
    });

    render(<MicrophoneHarness />);

    expect(await screen.findByText('permission:unsupported')).toBeInTheDocument();
    expect(screen.getByText('readiness:blocked')).toBeInTheDocument();
    expect(screen.getByText(/This browser is missing audio requirements/)).toBeInTheDocument();
  });

  it('NF-06 keeps missing hardware as an explicit blocked state', async () => {
    installBrowserTestMocks({
      permissionState: 'granted',
      getUserMediaError: new DOMException('No device', 'NotFoundError'),
    });

    render(<MicrophoneHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'request microphone access' }));

    await waitFor(() => {
      expect(screen.getByText('permission:granted')).toBeInTheDocument();
      expect(screen.getByText('readiness:blocked')).toBeInTheDocument();
      expect(screen.getByText('blocked:no-input-device')).toBeInTheDocument();
    });
  });
});
