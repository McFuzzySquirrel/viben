import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installBrowserTestMocks } from '../../test/mocks/browser';
import { renderApp } from '../../test/render-app';

describe('Game screen HUD flow', () => {
  it('shows blocked recovery messaging when microphone access is denied', async () => {
    installBrowserTestMocks({
      permissionState: 'denied',
      getUserMediaError: new DOMException('Permission denied', 'NotAllowedError'),
    });

    renderApp('/game');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Microphone access is currently denied by the browser.',
    );
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request microphone access' })).toBeEnabled();
  });

  it('renders the live playable HUD after starting a run', async () => {
    renderApp('/game');

    fireEvent.click(screen.getByRole('button', { name: 'Start run' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'End run' })).toBeEnabled();
    });

    expect(screen.getByRole('progressbar', { name: 'Moon progress' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Rocket stability' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Prompt hold' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Engine thrust' })).not.toBeInTheDocument();
    expect(screen.getByText('Read moon progress and stability at a glance')).toBeInTheDocument();
  });
});
