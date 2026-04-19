import { useEffect, useState } from 'react';

/**
 * Viewport breakpoint thresholds (pixels).
 *
 * - **mobile**: ≤ 480px
 * - **tablet**: ≤ 768px
 * - **desktop**: > 768px
 */
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
} as const;

export interface ViewportInfo {
  /** `true` when the viewport width is ≤ 480px. */
  isMobile: boolean;
  /** `true` when the viewport width is > 480px and ≤ 768px. */
  isTablet: boolean;
  /** `true` when the viewport width is > 768px. */
  isDesktop: boolean;
  /** `true` when height ≥ width. */
  isPortrait: boolean;
  /** `true` when width > height. */
  isLandscape: boolean;
}

function buildViewportInfo(
  mobileMatch: boolean,
  tabletMatch: boolean,
  portraitMatch: boolean,
): ViewportInfo {
  return {
    isMobile: mobileMatch,
    isTablet: !mobileMatch && tabletMatch,
    isDesktop: !tabletMatch,
    isPortrait: portraitMatch,
    isLandscape: !portraitMatch,
  };
}

/**
 * Returns reactive viewport information using `matchMedia` listeners.
 *
 * Uses media-query change events (not `resize`) to keep re-renders minimal and
 * in sync with the CSS breakpoints defined in `src/styles/global.css`.
 *
 * @returns {ViewportInfo} Current viewport classification.
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: false,
        isLandscape: true,
      };
    }

    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet}px)`);
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    return buildViewportInfo(mobileQuery.matches, tabletQuery.matches, portraitQuery.matches);
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet}px)`);
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    function update() {
      setViewport(
        buildViewportInfo(mobileQuery.matches, tabletQuery.matches, portraitQuery.matches),
      );
    }

    mobileQuery.addEventListener('change', update);
    tabletQuery.addEventListener('change', update);
    portraitQuery.addEventListener('change', update);

    // Sync on mount in case SSR initial value differs from client
    update();

    return () => {
      mobileQuery.removeEventListener('change', update);
      tabletQuery.removeEventListener('change', update);
      portraitQuery.removeEventListener('change', update);
    };
  }, []);

  return viewport;
}
