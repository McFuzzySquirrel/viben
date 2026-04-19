// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TOOLTIP_GROUP_IDS,
  TOOLTIPS_STORAGE_KEY,
  useFirstRunTooltips,
  type TooltipGroupId,
} from './useFirstRunTooltips';

describe('useFirstRunTooltips', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the first tooltip group on initial load', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    expect(result.current.currentTooltip).toBe('prompt-card');
    expect(result.current.shouldShow('prompt-card')).toBe(true);
    expect(result.current.shouldShow('stability-meter')).toBe(false);
    expect(result.current.shouldShow('rocket-feedback')).toBe(false);
    expect(result.current.shouldShow('moon-progress')).toBe(false);
  });

  it('advances to the next tooltip when the current one is dismissed', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.dismiss('prompt-card');
    });

    expect(result.current.currentTooltip).toBe('stability-meter');
    expect(result.current.shouldShow('prompt-card')).toBe(false);
    expect(result.current.shouldShow('stability-meter')).toBe(true);
  });

  it('walks through the full tooltip sequence in order', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    const expectedOrder: TooltipGroupId[] = [
      'prompt-card',
      'stability-meter',
      'rocket-feedback',
      'moon-progress',
    ];

    for (const expectedId of expectedOrder) {
      expect(result.current.currentTooltip).toBe(expectedId);

      act(() => {
        result.current.dismiss(expectedId);
      });
    }

    expect(result.current.currentTooltip).toBeNull();
  });

  it('advance() dismisses the current tooltip and moves to next', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.advance();
    });

    expect(result.current.currentTooltip).toBe('stability-meter');
  });

  it('advance() is a no-op when all tooltips are dismissed', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.dismissAll();
    });

    expect(result.current.currentTooltip).toBeNull();

    act(() => {
      result.current.advance();
    });

    expect(result.current.currentTooltip).toBeNull();
  });

  it('dismissAll stops all remaining tooltips immediately', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.dismissAll();
    });

    expect(result.current.currentTooltip).toBeNull();

    for (const groupId of TOOLTIP_GROUP_IDS) {
      expect(result.current.shouldShow(groupId)).toBe(false);
    }
  });

  it('persists dismissed tooltips in localStorage', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.dismiss('prompt-card');
    });

    const stored = JSON.parse(
      window.localStorage.getItem(TOOLTIPS_STORAGE_KEY) ?? '[]',
    ) as string[];

    expect(stored).toContain('prompt-card');
  });

  it('restores dismissed state from localStorage on mount', () => {
    window.localStorage.setItem(
      TOOLTIPS_STORAGE_KEY,
      JSON.stringify(['prompt-card', 'stability-meter']),
    );

    const { result } = renderHook(() => useFirstRunTooltips());

    expect(result.current.currentTooltip).toBe('rocket-feedback');
    expect(result.current.shouldShow('prompt-card')).toBe(false);
    expect(result.current.shouldShow('stability-meter')).toBe(false);
    expect(result.current.shouldShow('rocket-feedback')).toBe(true);
  });

  it('handles corrupt localStorage data gracefully', () => {
    window.localStorage.setItem(TOOLTIPS_STORAGE_KEY, '{not-valid}');

    const { result } = renderHook(() => useFirstRunTooltips());

    // Falls back to showing the first tooltip
    expect(result.current.currentTooltip).toBe('prompt-card');
    expect(result.current.shouldShow('prompt-card')).toBe(true);
  });

  it('handles non-array localStorage data gracefully', () => {
    window.localStorage.setItem(TOOLTIPS_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));

    const { result } = renderHook(() => useFirstRunTooltips());

    expect(result.current.currentTooltip).toBe('prompt-card');
  });

  it('ignores unrecognised group IDs in stored data', () => {
    window.localStorage.setItem(
      TOOLTIPS_STORAGE_KEY,
      JSON.stringify(['prompt-card', 'unknown-group', 'stability-meter']),
    );

    const { result } = renderHook(() => useFirstRunTooltips());

    expect(result.current.currentTooltip).toBe('rocket-feedback');
  });

  it('persists all groups when dismissAll is called', () => {
    const { result } = renderHook(() => useFirstRunTooltips());

    act(() => {
      result.current.dismissAll();
    });

    const stored = JSON.parse(
      window.localStorage.getItem(TOOLTIPS_STORAGE_KEY) ?? '[]',
    ) as string[];

    expect(stored).toHaveLength(TOOLTIP_GROUP_IDS.length);

    for (const groupId of TOOLTIP_GROUP_IDS) {
      expect(stored).toContain(groupId);
    }
  });

  it('returns null currentTooltip when all have been seen', () => {
    window.localStorage.setItem(
      TOOLTIPS_STORAGE_KEY,
      JSON.stringify([...TOOLTIP_GROUP_IDS]),
    );

    const { result } = renderHook(() => useFirstRunTooltips());

    expect(result.current.currentTooltip).toBeNull();
  });
});
