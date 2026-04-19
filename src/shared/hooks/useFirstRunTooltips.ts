import { useCallback, useMemo, useState } from 'react';
import { readJsonFromStorage, writeJsonToStorage } from '@shared/persistence/storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TOOLTIPS_STORAGE_KEY = 'viben:tooltips-seen';

/**
 * Ordered sequence of tooltip group IDs displayed during the first run.
 * Tooltips are shown one at a time in this order.
 */
export const TOOLTIP_GROUP_IDS = [
  'prompt-card',
  'stability-meter',
  'rocket-feedback',
  'moon-progress',
] as const;

export type TooltipGroupId = (typeof TOOLTIP_GROUP_IDS)[number];

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Load seen-tooltip IDs from localStorage.
 *
 * Follows the same graceful-recovery pattern used in `progression-storage`:
 * invalid JSON or corrupt schemas silently fall back to an empty set so
 * tooltips re-appear rather than crash the app.
 */
function loadSeenGroups(storage?: Storage | null): Set<TooltipGroupId> {
  const result = readJsonFromStorage(TOOLTIPS_STORAGE_KEY, storage);

  if (result.issue || !result.hasStoredValue) {
    return new Set();
  }

  if (!isStringArray(result.value)) {
    // Corrupt data — wipe it so the next write stores a clean array
    return new Set();
  }

  // Keep only recognised IDs — ignore anything unexpected
  const validIds = new Set<TooltipGroupId>();
  for (const id of result.value) {
    if ((TOOLTIP_GROUP_IDS as readonly string[]).includes(id)) {
      validIds.add(id as TooltipGroupId);
    }
  }

  return validIds;
}

function persistSeenGroups(groups: Set<TooltipGroupId>, storage?: Storage | null): void {
  writeJsonToStorage(TOOLTIPS_STORAGE_KEY, [...groups], storage);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseFirstRunTooltipsResult {
  /** Whether a given tooltip group should be displayed right now. */
  shouldShow: (groupId: TooltipGroupId) => boolean;
  /** Dismiss a specific tooltip group and advance to the next. */
  dismiss: (groupId: TooltipGroupId) => void;
  /** Dismiss all remaining tooltips at once. */
  dismissAll: () => void;
  /** The group ID of the currently active tooltip, or `null` if all are seen. */
  currentTooltip: TooltipGroupId | null;
  /** Explicitly advance to the next tooltip (same as dismissing the current one). */
  advance: () => void;
}

/**
 * Manages the sequenced first-run tooltip flow.
 *
 * On the very first game run, tooltips are shown one at a time in the order
 * defined by `TOOLTIP_GROUP_IDS`. Dismissal state is persisted in
 * `localStorage` under the `viben:tooltips-seen` key so that tooltips never
 * reappear once acknowledged.
 */
export function useFirstRunTooltips(storage?: Storage | null): UseFirstRunTooltipsResult {
  const [seenGroups, setSeenGroups] = useState<Set<TooltipGroupId>>(() => loadSeenGroups(storage));

  const currentTooltip = useMemo<TooltipGroupId | null>(() => {
    for (const groupId of TOOLTIP_GROUP_IDS) {
      if (!seenGroups.has(groupId)) {
        return groupId;
      }
    }
    return null;
  }, [seenGroups]);

  const shouldShow = useCallback(
    (groupId: TooltipGroupId): boolean => {
      return currentTooltip === groupId;
    },
    [currentTooltip],
  );

  const dismiss = useCallback(
    (groupId: TooltipGroupId): void => {
      setSeenGroups((prev) => {
        const next = new Set(prev);
        next.add(groupId);
        persistSeenGroups(next, storage);
        return next;
      });
    },
    [storage],
  );

  const dismissAll = useCallback((): void => {
    setSeenGroups(() => {
      const all = new Set<TooltipGroupId>(TOOLTIP_GROUP_IDS);
      persistSeenGroups(all, storage);
      return all;
    });
  }, [storage]);

  const advance = useCallback((): void => {
    if (currentTooltip) {
      dismiss(currentTooltip);
    }
  }, [currentTooltip, dismiss]);

  return { shouldShow, dismiss, dismissAll, currentTooltip, advance };
}
