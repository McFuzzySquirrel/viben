import { useState, useId, type ReactNode } from 'react';

export interface TabDefinition {
  /** Unique key for the tab. */
  id: string;
  /** Visible label shown on the tab button. */
  label: string;
  /** Content rendered inside the tab panel. */
  content: ReactNode;
}

export interface TabPanelProps {
  /** Accessible label for the tablist. */
  label: string;
  /** Tab definitions to render. Must contain at least one entry. */
  tabs: readonly TabDefinition[];
  /** Optional: which tab id to show initially. Defaults to first tab. */
  defaultTabId?: string;
}

/**
 * Accessible tabbed panel component.
 *
 * Renders a `role="tablist"` with `role="tab"` buttons and exactly one
 * visible `role="tabpanel"` at a time. Supports arrow-key navigation
 * between tabs following the WAI-ARIA Tabs pattern.
 */
export function TabPanel({ label, tabs, defaultTabId }: TabPanelProps) {
  const baseId = useId();
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id ?? '');

  if (tabs.length === 0) {
    return null;
  }

  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;
  const activeTab = tabs[safeIndex];

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (safeIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (safeIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTabId(nextTab.id);

    // Focus the newly-active tab button
    const tabButton = event.currentTarget.querySelector<HTMLButtonElement>(
      `[data-tab-id="${nextTab.id}"]`,
    );
    tabButton?.focus();
  }

  return (
    <div className="tab-panel">
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus is managed on children */}
      <div
        aria-label={label}
        className="tab-panel__list"
        onKeyDown={handleKeyDown}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={isActive ? 'tab-panel__tab tab-panel__tab--active' : 'tab-panel__tab'}
              data-tab-id={tab.id}
              id={tabId}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        className="tab-panel__content"
        id={`${baseId}-panel-${activeTab.id}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeTab.content}
      </div>
    </div>
  );
}
