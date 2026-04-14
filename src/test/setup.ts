import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installBrowserTestMocks, resetBrowserTestMocks } from './mocks/browser';

beforeEach(() => {
  installBrowserTestMocks();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  resetBrowserTestMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
