import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  targetRef: React.RefObject<HTMLElement | null>;
  content: React.ReactNode;
  position: TooltipPosition;
  visible: boolean;
  onDismiss: () => void;
  /** Optional callback to skip all remaining tooltips. */
  onSkipAll?: () => void;
}

interface PositionStyle {
  top: number;
  left: number;
  actualPosition: TooltipPosition;
}

const TOOLTIP_GAP = 10;
const VIEWPORT_MARGIN = 12;

function computePosition(
  targetRect: DOMRect,
  tooltipRect: DOMRect,
  preferred: TooltipPosition,
): PositionStyle {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  function tryPosition(pos: TooltipPosition): PositionStyle | null {
    let top: number;
    let left: number;

    switch (pos) {
      case 'top':
        top = targetRect.top - tooltipRect.height - TOOLTIP_GAP;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + TOOLTIP_GAP;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - TOOLTIP_GAP;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + TOOLTIP_GAP;
        break;
    }

    // Check if the tooltip fits within viewport bounds
    if (
      top < VIEWPORT_MARGIN ||
      top + tooltipRect.height > viewportHeight - VIEWPORT_MARGIN ||
      left < VIEWPORT_MARGIN ||
      left + tooltipRect.width > viewportWidth - VIEWPORT_MARGIN
    ) {
      return null;
    }

    return { top, left, actualPosition: pos };
  }

  // Try the preferred position first, then fall back in order
  const fallbacks: TooltipPosition[] = ['bottom', 'top', 'right', 'left'];
  const ordered = [preferred, ...fallbacks.filter((p) => p !== preferred)];

  for (const pos of ordered) {
    const result = tryPosition(pos);
    if (result) return result;
  }

  // If nothing fits, use the preferred position but clamp to viewport
  let top: number;
  let left: number;

  switch (preferred) {
    case 'top':
      top = targetRect.top - tooltipRect.height - TOOLTIP_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'bottom':
      top = targetRect.bottom + TOOLTIP_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.left - tooltipRect.width - TOOLTIP_GAP;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.right + TOOLTIP_GAP;
      break;
  }

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - tooltipRect.height - VIEWPORT_MARGIN));
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_MARGIN));

  return { top, left, actualPosition: preferred };
}

export function Tooltip({
  targetRef,
  content,
  position,
  visible,
  onDismiss,
  onSkipAll,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<PositionStyle | null>(null);

  const updatePosition = useCallback(() => {
    const target = targetRef.current;
    const tooltip = tooltipRef.current;

    if (!target || !tooltip || !visible) {
      setPositionStyle(null);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    setPositionStyle(computePosition(targetRect, tooltipRect, position));
  }, [targetRef, position, visible]);

  // Position on mount/change using layout effect for flicker-free placement
  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!visible) return;

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible, updatePosition]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!visible) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onDismiss]);

  // Focus the dismiss button when tooltip becomes visible
  useEffect(() => {
    if (!visible) return;

    // Use a microtask to let the DOM update before focusing
    const timeoutId = setTimeout(() => {
      const dismissButton = tooltipRef.current?.querySelector<HTMLButtonElement>(
        '.tooltip__dismiss',
      );
      dismissButton?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className={`tooltip tooltip--${positionStyle?.actualPosition ?? position}`}
      ref={tooltipRef}
      role="status"
      style={
        positionStyle
          ? {
              position: 'fixed',
              top: `${positionStyle.top}px`,
              left: `${positionStyle.left}px`,
            }
          : {
              position: 'fixed',
              visibility: 'hidden',
            }
      }
    >
      <div className="tooltip__content">{content}</div>
      <div className="tooltip__actions">
        <button
          className="button tooltip__dismiss"
          onClick={onDismiss}
          type="button"
        >
          Got it
        </button>
        {onSkipAll ? (
          <button
            className="tooltip__skip-all"
            onClick={onSkipAll}
            type="button"
          >
            Skip all tips
          </button>
        ) : null}
      </div>
    </div>
  );
}
