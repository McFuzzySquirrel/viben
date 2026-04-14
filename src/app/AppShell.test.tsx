import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VIBEN_LOCAL_SAVE_KEY } from '@shared/persistence';
import { installBrowserTestMocks } from '../test/mocks/browser';
import { renderApp } from '../test/render-app';

describe('App shell foundation coverage', () => {
  it('AC-01 keeps home, game, results, and progress routes inside the app shell', async () => {
    const { router } = renderApp();

    expect(screen.getByRole('heading', { name: "Vib'N: Rocket to the Moon" })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Start the Phase 1 singing run flow from a clear home screen.',
      }),
    ).toBeInTheDocument();

    await router.navigate('/game');
    expect(
      await screen.findByRole('heading', {
        name: 'Present the future run loop as an intentional, accessible HUD shell.',
      }),
    ).toBeInTheDocument();

    await router.navigate('/results');
    expect(
      await screen.findByRole('heading', {
        name: 'Keep the routed summary screen in place for future run outcomes.',
      }),
    ).toBeInTheDocument();

    await router.navigate('/progress');
    expect(
      await screen.findByRole('heading', {
        name: 'Keep local-only progression visible without committing to final reports yet.',
      }),
    ).toBeInTheDocument();
  });

  it('AC-03 persists the selected difficulty and carries it into the game shell route', async () => {
    const { router } = renderApp();

    fireEvent.click(screen.getByRole('radio', { name: /hard/i }));

    await waitFor(() => {
      const storedSave = JSON.parse(window.localStorage.getItem(VIBEN_LOCAL_SAVE_KEY) ?? '{}') as {
        selectedDifficultyId?: string;
      };

      expect(storedSave.selectedDifficultyId).toBe('hard');
    });

    await router.navigate('/game');

    expect(
      await screen.findByRole('heading', {
        name: 'Present the future run loop as an intentional, accessible HUD shell.',
      }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('Hard')).not.toHaveLength(0);
    expect(screen.getByText('±25 cents')).toBeInTheDocument();
  });

  it('NF-06 shows a blocked support banner when required browser capabilities are missing', async () => {
    installBrowserTestMocks({
      hasMediaDevices: false,
      hasWebAudio: false,
      localStorageMode: 'unavailable',
    });

    renderApp();

    const [supportBannerAlert] = await screen.findAllByRole('alert');

    expect(supportBannerAlert).toHaveTextContent(
      'This prototype requires microphone access, Web Audio, and local storage.',
    );
    expect(supportBannerAlert).toHaveTextContent(
      'Missing capabilities: MediaDevices.getUserMedia, Web Audio API, localStorage.',
    );
  });
});
