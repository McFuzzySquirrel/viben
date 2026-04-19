/**
 * Playwright script to capture walkthrough screenshots for the README.
 *
 * Run with: npm run screenshots
 *
 * Produces PNGs in docs/screenshots/ that can be embedded in documentation.
 */
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Seed data — realistic progression state so screens look populated
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
const twoHoursAgo = new Date(Date.now() - 7_200_000).toISOString();
const threeDaysAgo = new Date(Date.now() - 259_200_000).toISOString();
const fiveDaysAgo = new Date(Date.now() - 432_000_000).toISOString();

const SEED_PROGRESSION = {
  version: 1,
  selectedDifficultyId: 'easy',
  lastUpdatedAt: now,
  runHistory: [
    {
      id: 'run-001',
      recordedAt: oneHourAgo,
      difficultyId: 'easy',
      outcome: 'completed',
      endReason: 'target-reached',
      score: 4820,
      stars: 3,
      durationMs: 68_000,
      comparisonGroupId: null,
      hazardsFaced: 4,
      boostsCaught: 2,
      performance: {
        accuracyPercent: 82,
        timeOnTargetMs: 41_200,
        longestCorrectStreak: 7,
        promptsCleared: 18,
        promptsPresented: 22,
      },
    },
    {
      id: 'run-002',
      recordedAt: twoHoursAgo,
      difficultyId: 'easy',
      outcome: 'failed',
      endReason: 'stability-lost',
      score: 2310,
      stars: 1,
      durationMs: 34_000,
      comparisonGroupId: null,
      hazardsFaced: 3,
      boostsCaught: 1,
      performance: {
        accuracyPercent: 54,
        timeOnTargetMs: 18_500,
        longestCorrectStreak: 4,
        promptsCleared: 8,
        promptsPresented: 15,
      },
    },
    {
      id: 'run-003',
      recordedAt: threeDaysAgo,
      difficultyId: 'easy',
      outcome: 'completed',
      endReason: 'target-reached',
      score: 3500,
      stars: 2,
      durationMs: 55_000,
      comparisonGroupId: null,
      hazardsFaced: 5,
      boostsCaught: 3,
      performance: {
        accuracyPercent: 68,
        timeOnTargetMs: 30_000,
        longestCorrectStreak: 5,
        promptsCleared: 14,
        promptsPresented: 20,
      },
    },
    {
      id: 'run-004',
      recordedAt: fiveDaysAgo,
      difficultyId: 'normal',
      outcome: 'failed',
      endReason: 'stability-lost',
      score: 1200,
      stars: 1,
      durationMs: 22_000,
      comparisonGroupId: null,
      hazardsFaced: 2,
      boostsCaught: 0,
      performance: {
        accuracyPercent: 40,
        timeOnTargetMs: 8_800,
        longestCorrectStreak: 3,
        promptsCleared: 5,
        promptsPresented: 10,
      },
    },
  ],
  difficultyRecords: {
    easy: {
      difficultyId: 'easy',
      isUnlocked: true,
      unlockedAt: null,
      lastPlayedAt: oneHourAgo,
      runCount: 3,
      completedRunCount: 2,
      bestScore: 4820,
      bestStars: 3,
      bestAccuracyPercent: 82,
      bestTimeOnTargetMs: 41_200,
    },
    normal: {
      difficultyId: 'normal',
      isUnlocked: true,
      unlockedAt: threeDaysAgo,
      lastPlayedAt: fiveDaysAgo,
      runCount: 1,
      completedRunCount: 0,
      bestScore: 1200,
      bestStars: 1,
      bestAccuracyPercent: 40,
      bestTimeOnTargetMs: 8_800,
    },
    hard: {
      difficultyId: 'hard',
      isUnlocked: true,
      unlockedAt: null,
      lastPlayedAt: null,
      runCount: 0,
      completedRunCount: 0,
      bestScore: null,
      bestStars: null,
      bestAccuracyPercent: null,
      bestTimeOnTargetMs: null,
    },
  },
  milestones: [
    { id: 'first-run', kind: 'participation', difficultyId: 'global', achievedAt: fiveDaysAgo },
    { id: 'first-completion', kind: 'participation', difficultyId: 'global', achievedAt: threeDaysAgo },
    { id: 'score-1000', kind: 'performance', difficultyId: 'global', achievedAt: fiveDaysAgo },
    { id: 'score-3000', kind: 'performance', difficultyId: 'global', achievedAt: threeDaysAgo },
    { id: 'three-stars', kind: 'performance', difficultyId: 'global', achievedAt: oneHourAgo },
    { id: 'try-normal', kind: 'difficulty', difficultyId: 'normal', achievedAt: fiveDaysAgo },
  ],
};

const SEED_VOICE_PROFILE = {
  createdAt: threeDaysAgo,
  notes: {
    do: { medianFrequencyHz: 132.5, minFrequencyHz: 128.0, maxFrequencyHz: 138.0, sampleCount: 18 },
    re: { medianFrequencyHz: 148.2, minFrequencyHz: 143.0, maxFrequencyHz: 154.0, sampleCount: 16 },
    mi: { medianFrequencyHz: 166.8, minFrequencyHz: 161.0, maxFrequencyHz: 172.0, sampleCount: 17 },
    fa: { medianFrequencyHz: 176.5, minFrequencyHz: 171.0, maxFrequencyHz: 182.0, sampleCount: 15 },
    sol: { medianFrequencyHz: 198.0, minFrequencyHz: 192.0, maxFrequencyHz: 204.0, sampleCount: 19 },
    la: { medianFrequencyHz: 222.4, minFrequencyHz: 216.0, maxFrequencyHz: 229.0, sampleCount: 16 },
    ti: { medianFrequencyHz: 249.8, minFrequencyHz: 243.0, maxFrequencyHz: 256.0, sampleCount: 17 },
  },
};

// ---------------------------------------------------------------------------
// Helper: inject seed data into localStorage before the page renders
// ---------------------------------------------------------------------------

function seedStorageScript(progression: object, voiceProfile: object) {
  return `
    window.localStorage.setItem('viben:progression', JSON.stringify(${JSON.stringify(progression)}));
    window.localStorage.setItem('viben:voice-profile', JSON.stringify(${JSON.stringify(voiceProfile)}));
  `;
}

// ---------------------------------------------------------------------------
// Screenshot output path helper
// ---------------------------------------------------------------------------

const SCREENSHOT_DIR = 'docs/screenshots';

function screenshotPath(name: string) {
  return `${SCREENSHOT_DIR}/${name}.png`;
}

// ---------------------------------------------------------------------------
// Tests — each test captures one screen
// ---------------------------------------------------------------------------

test.describe('Walkthrough screenshots', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name === 'screenshots-mobile', 'Desktop-only tests');

    // Grant microphone permission so calibration and game screens render fully
    await context.grantPermissions(['microphone']);
    // Seed localStorage before any page loads
    await context.addInitScript(seedStorageScript(SEED_PROGRESSION, SEED_VOICE_PROFILE));
  });

  test('01 — Home screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.screen');
    // Allow any animations to settle
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('01-home'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('02 — Game screen (pre-launch)', async ({ page }) => {
    await page.goto('/game');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('02-game'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('03 — Calibration screen', async ({ page }) => {
    await page.goto('/calibration');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('03-calibration'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('04 — Results screen', async ({ page }) => {
    await page.goto('/results');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('04-results'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('05 — Progress screen', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('05-progress'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Mobile walkthrough screenshots (iPhone 14 viewport)
// ---------------------------------------------------------------------------

test.describe('Mobile walkthrough screenshots', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== 'screenshots-mobile', 'Mobile-only tests');

    // Grant microphone permission so calibration and game screens render fully
    await context.grantPermissions(['microphone']);
    // Seed localStorage before any page loads
    await context.addInitScript(seedStorageScript(SEED_PROGRESSION, SEED_VOICE_PROFILE));
  });

  test('06 — Home screen (mobile)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('06-home-mobile'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('07 — Game screen (mobile)', async ({ page }) => {
    await page.goto('/game');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('07-game-mobile'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });

  test('08 — Calibration screen (mobile)', async ({ page }) => {
    await page.goto('/calibration');
    await page.waitForSelector('.screen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath('08-calibration-mobile'), fullPage: true });
    await expect(page.locator('.screen')).toBeVisible();
  });
});
