import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TabPanel } from './TabPanel';

const TABS = [
  { id: 'alpha', label: 'Alpha', content: <p>Alpha content</p> },
  { id: 'beta', label: 'Beta', content: <p>Beta content</p> },
  { id: 'gamma', label: 'Gamma', content: <p>Gamma content</p> },
];

describe('TabPanel', () => {
  it('renders all tab buttons and shows only the first panel by default', () => {
    render(<TabPanel label="Test tabs" tabs={TABS} />);

    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha content');
    expect(screen.queryByText('Beta content')).not.toBeInTheDocument();
  });

  it('respects defaultTabId', () => {
    render(<TabPanel defaultTabId="beta" label="Test tabs" tabs={TABS} />);

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta content');
  });

  it('switches tabs on click', () => {
    render(<TabPanel label="Test tabs" tabs={TABS} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }));

    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma content');
  });

  it('navigates tabs with ArrowRight and ArrowLeft', () => {
    render(<TabPanel label="Test tabs" tabs={TABS} />);

    const tablist = screen.getByRole('tablist');

    // Focus the first tab
    screen.getByRole('tab', { name: 'Alpha' }).focus();

    // Arrow right → Beta
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta content');

    // Arrow right → Gamma
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma content');

    // Arrow right wraps → Alpha
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha content');

    // Arrow left wraps → Gamma
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma content');
  });

  it('navigates to first and last tabs with Home and End', () => {
    render(<TabPanel defaultTabId="beta" label="Test tabs" tabs={TABS} />);

    const tablist = screen.getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha content');

    fireEvent.keyDown(tablist, { key: 'End' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma content');
  });

  it('sets inactive tabs to tabIndex -1 for roving focus', () => {
    render(<TabPanel label="Test tabs" tabs={TABS} />);

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('tabindex', '-1');
  });

  it('wires aria-controls and aria-labelledby between tabs and panels', () => {
    render(<TabPanel label="Test tabs" tabs={TABS} />);

    const activeTab = screen.getByRole('tab', { name: 'Alpha' });
    const panel = screen.getByRole('tabpanel');

    expect(activeTab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.id);
  });

  it('renders nothing when tabs array is empty', () => {
    const { container } = render(<TabPanel label="Empty" tabs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
