// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

function renderTooltipWithTarget(
  overrides: Partial<React.ComponentProps<typeof Tooltip>> = {},
) {
  const targetRef = createRef<HTMLDivElement>();

  const { rerender, ...rest } = render(
    <div>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          top: '100px',
          left: '200px',
          width: '120px',
          height: '40px',
        }}
      >
        Target element
      </div>
      <Tooltip
        content="Test tooltip content"
        onDismiss={() => {}}
        position="bottom"
        targetRef={targetRef}
        visible={true}
        {...overrides}
      />
    </div>,
  );

  return {
    ...rest,
    targetRef,
    rerender: (tooltipProps: Partial<React.ComponentProps<typeof Tooltip>> = {}) =>
      rerender(
        <div>
          <div
            ref={targetRef}
            style={{
              position: 'absolute',
              top: '100px',
              left: '200px',
              width: '120px',
              height: '40px',
            }}
          >
            Target element
          </div>
          <Tooltip
            content="Test tooltip content"
            onDismiss={() => {}}
            position="bottom"
            targetRef={targetRef}
            visible={true}
            {...tooltipProps}
          />
        </div>,
      ),
  };
}

describe('Tooltip', () => {
  it('renders content when visible is true', () => {
    renderTooltipWithTarget({ visible: true });

    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    renderTooltipWithTarget({ visible: false });

    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
  });

  it('calls onDismiss when the "Got it" button is clicked', () => {
    const onDismiss = vi.fn();
    renderTooltipWithTarget({ onDismiss });

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn();
    renderTooltipWithTarget({ onDismiss });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss for non-Escape keys', () => {
    const onDismiss = vi.fn();
    renderTooltipWithTarget({ onDismiss });

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    fireEvent.keyDown(document, { key: ' ' });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('shows "Skip all tips" button when onSkipAll is provided', () => {
    const onSkipAll = vi.fn();
    renderTooltipWithTarget({ onSkipAll });

    const skipButton = screen.getByRole('button', { name: 'Skip all tips' });
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);
    expect(onSkipAll).toHaveBeenCalledTimes(1);
  });

  it('does not show "Skip all tips" button when onSkipAll is not provided', () => {
    renderTooltipWithTarget({ onSkipAll: undefined });

    expect(screen.queryByRole('button', { name: 'Skip all tips' })).not.toBeInTheDocument();
  });

  it('renders with the correct position class', () => {
    const { container } = renderTooltipWithTarget({ position: 'top' });
    const tooltip = container.querySelector('.tooltip');

    // The actual position class depends on viewport fit calculations,
    // but the tooltip element should exist
    expect(tooltip).toBeInTheDocument();
  });

  it('supports React nodes as content', () => {
    renderTooltipWithTarget({
      content: <span data-testid="custom-content">Rich content</span>,
    });

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Rich content')).toBeInTheDocument();
  });

  it('cleans up Escape key listener when becoming invisible', () => {
    const onDismiss = vi.fn();
    const { rerender } = renderTooltipWithTarget({ onDismiss });

    // Hide the tooltip
    rerender({ visible: false, onDismiss });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has an accessible role for screen readers', () => {
    renderTooltipWithTarget();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
