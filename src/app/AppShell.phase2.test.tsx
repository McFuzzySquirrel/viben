import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VIBEN_LOCAL_SAVE_KEY } from '@shared/persistence';
import { installBrowserTestMocks } from '../test/mocks/browser';
import { renderApp } from '../test/render-app';

function hasNormalizedText(node: Element | null, expectedText: string) {
  return node?.textContent?.replace(/\s+/g, ' ').trim().includes(expectedText) ?? false;
}

function readStoredSave() {
  return JSON.parse(window.localStorage.getItem(VIBEN_LOCAL_SAVE_KEY) ?? '{}') as {
    selectedDifficultyId?: string;
    runHistory?: Array<{
      difficultyId: string;
      outcome: string;
      endReason: string | null;
    }>;
  };
}

describe('Phase 2 app shell acceptance coverage', () => {
  it('AC-01 AC-04 AC-09 AC-10 AC-11 starts from home, reaches results, and restores the saved run after refresh', async () => {
    const firstRender = renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Start singing run' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Sing the prompt and steer the rocket to the moon.',
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'End run' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'End run' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Run abandoned review',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 / 3 stars', { selector: 'strong' })).toBeInTheDocument();

    await waitFor(() => {
      const storedSave = readStoredSave();

      expect(storedSave.selectedDifficultyId).toBe('easy');
      expect(storedSave.runHistory?.[0]).toEqual(
        expect.objectContaining({
          difficultyId: 'easy',
          outcome: 'abandoned',
          endReason: 'abandoned',
        }),
      );
    });

    firstRender.unmount();

    renderApp('/progress');

    expect(
      await screen.findByRole('heading', {
        name: 'Local run history and comparison.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Read back from save')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('listitem')
        .some((item) => hasNormalizedText(item, '0 on Easy • Abandoned')),
    ).toBe(true);
  });

  it('AC-02 NF-06 recovers from denied microphone setup across home and game routes without reloading', async () => {
    installBrowserTestMocks({
      permissionState: 'denied',
      getUserMediaError: new DOMException('Permission denied', 'NotAllowedError'),
    });

    const { router } = renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Microphone access is currently denied by the browser.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start singing run' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/game');
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Sing the prompt and steer the rocket to the moon.',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Microphone access was denied. Enable microphone permission to continue.',
    );

    fireEvent.click(screen.getByRole('link', { name: 'Back to home' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Choose a difficulty, confirm your mic, and launch the first playable run.',
      }),
    ).toBeInTheDocument();

    installBrowserTestMocks({
      permissionState: 'granted',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Check microphone now' }));

    await waitFor(() => {
      expect(screen.getByText(/Microphone ready for launch/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start singing run' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/game');
      expect(screen.getByRole('button', { name: 'End run' })).toBeEnabled();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
