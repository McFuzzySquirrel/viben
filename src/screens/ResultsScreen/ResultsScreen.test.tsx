import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameRunSummary } from '@features/game';
import { VIBEN_LOCAL_SAVE_KEY } from '@shared/persistence';
import { renderApp } from '../../test/render-app';

function hasNormalizedText(node: Element | null, expectedText: string) {
  return node?.textContent?.replace(/\s+/g, ' ').trim().includes(expectedText) ?? false;
}

function findListItem(expectedText: string) {
  return screen
    .getAllByRole('listitem')
    .find((item) => hasNormalizedText(item, expectedText));
}

const SAMPLE_RUN_SUMMARY: GameRunSummary = {
  id: 'run-results-001',
  recordedAt: '2026-04-14T12:34:56.000Z',
  difficultyId: 'normal',
  outcome: 'completed',
  endReason: 'moon-reached',
  score: 1720,
  stars: 3,
  durationMs: 84000,
  comparisonGroupId: null,
  hazardsTriggered: 2,
  boostsTriggered: 3,
  finalAltitude: 1000,
  finalStability: 64,
  targetAltitude: 1000,
  performance: {
    accuracyPercent: 84.5,
    timeOnTargetMs: 51200,
    longestCorrectStreak: 11,
    promptsCleared: 14,
    promptsPresented: 17,
  },
};

describe('Results screen save flow', () => {
  it('persists routed run summaries and reloads them into progress history', async () => {
    const firstRender = renderApp();

    await firstRender.router.navigate('/results', {
      state: {
        runSummary: SAMPLE_RUN_SUMMARY,
      },
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Mission complete review',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('1720', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('84.5%', { selector: 'strong' })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, node) => node?.tagName === 'DD' && hasNormalizedText(node, '14 / 17'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Moon Reached')).toBeInTheDocument();

    await waitFor(() => {
      const storedSave = JSON.parse(window.localStorage.getItem(VIBEN_LOCAL_SAVE_KEY) ?? '{}') as {
        runHistory?: Array<{
          id: string;
          score: number;
          endReason: string | null;
          hazardsFaced: number;
          boostsCaught: number;
        }>;
      };

      expect(storedSave.runHistory?.[0]).toEqual(
        expect.objectContaining({
          id: SAMPLE_RUN_SUMMARY.id,
          score: 1720,
          endReason: 'moon-reached',
          hazardsFaced: 2,
          boostsCaught: 3,
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
    expect(screen.getByText('Recent local runs')).toBeInTheDocument();
    expect(
      findListItem('1720 on Normal • Complete • 1:24 • 84.5% accuracy • 14 / 17 prompts • 2 hazards • 3 boosts'),
    ).toBeDefined();
  });
});
