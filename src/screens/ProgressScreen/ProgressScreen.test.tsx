import { screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VIBEN_LOCAL_SAVE_KEY, VIBEN_LOCAL_SAVE_VERSION } from '@shared/persistence';
import { renderApp } from '../../test/render-app';

function hasNormalizedText(node: Element | null, expectedText: string) {
  return node?.textContent?.replace(/\s+/g, ' ').trim().includes(expectedText) ?? false;
}

describe('Progress screen local comparison', () => {
  it('AC-12 reads saved run history back into same-device comparison cards after refresh', async () => {
    window.localStorage.setItem(
      VIBEN_LOCAL_SAVE_KEY,
      JSON.stringify({
        version: VIBEN_LOCAL_SAVE_VERSION,
        selectedDifficultyId: 'normal',
        lastUpdatedAt: '2026-04-14T12:35:00.000Z',
        milestones: [],
        difficultyRecords: {},
        runHistory: [
          {
            id: 'run-progress-002',
            recordedAt: '2026-04-14T12:35:00.000Z',
            difficultyId: 'normal',
            outcome: 'completed',
            endReason: 'moon-reached',
            score: 1800,
            stars: 3,
            durationMs: 82000,
            comparisonGroupId: null,
            hazardsFaced: 1,
            boostsCaught: 4,
            performance: {
              accuracyPercent: 88,
              timeOnTargetMs: 56000,
              longestCorrectStreak: 12,
              promptsCleared: 15,
              promptsPresented: 18,
            },
          },
          {
            id: 'run-progress-001',
            recordedAt: '2026-04-14T12:30:00.000Z',
            difficultyId: 'normal',
            outcome: 'failed',
            endReason: 'stability-depleted',
            score: 1200,
            stars: 2,
            durationMs: 70000,
            comparisonGroupId: null,
            hazardsFaced: 3,
            boostsCaught: 1,
            performance: {
              accuracyPercent: 70,
              timeOnTargetMs: 41000,
              longestCorrectStreak: 8,
              promptsCleared: 10,
              promptsPresented: 16,
            },
          },
        ],
      }),
    );

    renderApp('/progress');

    expect(
      await screen.findByRole('heading', {
        name: 'Local run history and comparison.',
      }),
    ).toBeInTheDocument();

    // Switch to the Comparison tab to see comparison data
    fireEvent.click(screen.getByRole('tab', { name: 'Comparison' }));

    expect(screen.getByText('Compare recent Normal runs')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('listitem')
        .some((item) =>
          hasNormalizedText(
            item,
            '1800 score (3 stars) • Complete • Δ score +600 • Δ accuracy +18% • Δ target time +15000 ms',
          ),
        ),
    ).toBe(true);

    // Switch to the Overview tab to see recent runs
    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));

    expect(
      screen
        .getAllByRole('listitem')
        .some((item) =>
          hasNormalizedText(
            item,
            '1800 on Normal • Complete • 1:22 • 88% accuracy • 15 / 18 prompts • 1 hazards • 4 boosts',
          ),
        ),
    ).toBe(true);
  });
});
