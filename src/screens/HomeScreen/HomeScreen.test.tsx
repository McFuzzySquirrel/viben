import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render-app';

describe('Home screen launch flow', () => {
  it('starts the run flow from home and lands in the playable HUD', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Start singing run' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'End run' })).toBeEnabled();
    });

    expect(screen.getByText('Run in progress')).toBeInTheDocument();
  });
});
