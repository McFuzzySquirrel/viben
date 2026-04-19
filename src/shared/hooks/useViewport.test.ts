import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewport } from './useViewport';

// ---------------------------------------------------------------------------
// Helpers — matchMedia stub
// ---------------------------------------------------------------------------

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  listeners: Array<(e: MediaQueryListEvent) => void>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchChange: (matches: boolean) => void;
}

function createMockMql(query: string, matches: boolean): MockMediaQueryList {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  const mql: MockMediaQueryList = {
    matches,
    media: query,
    listeners,
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    dispatchChange(newMatches: boolean) {
      mql.matches = newMatches;
      for (const listener of [...listeners]) {
        listener({ matches: newMatches, media: query } as MediaQueryListEvent);
      }
    },
  };

  return mql;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useViewport', () => {
  let mqls: Map<string, MockMediaQueryList>;
  let originalMatchMedia: typeof window.matchMedia;

  function installMatchMedia(opts: {
    mobile: boolean;
    tablet: boolean;
    portrait: boolean;
  }) {
    mqls = new Map();

    const mobileMql = createMockMql('(max-width: 480px)', opts.mobile);
    const tabletMql = createMockMql('(max-width: 768px)', opts.tablet);
    const portraitMql = createMockMql('(orientation: portrait)', opts.portrait);

    mqls.set('480', mobileMql);
    mqls.set('768', tabletMql);
    mqls.set('portrait', portraitMql);

    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => {
      if (query.includes('480')) return mobileMql as unknown as MediaQueryList;
      if (query.includes('768')) return tabletMql as unknown as MediaQueryList;
      if (query.includes('portrait')) return portraitMql as unknown as MediaQueryList;
      return mobileMql as unknown as MediaQueryList;
    });
  }

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('identifies desktop landscape by default (wide screen)', () => {
    installMatchMedia({ mobile: false, tablet: false, portrait: false });

    const { result } = renderHook(() => useViewport());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isPortrait: false,
      isLandscape: true,
    });
  });

  it('identifies mobile portrait', () => {
    installMatchMedia({ mobile: true, tablet: true, portrait: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false); // isTablet is only true when NOT mobile
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  it('identifies tablet (between mobile and desktop)', () => {
    installMatchMedia({ mobile: false, tablet: true, portrait: false });

    const { result } = renderHook(() => useViewport());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isLandscape).toBe(true);
  });

  it('reacts to matchMedia changes', () => {
    installMatchMedia({ mobile: false, tablet: false, portrait: false });

    const { result } = renderHook(() => useViewport());

    expect(result.current.isDesktop).toBe(true);

    // Simulate resizing to tablet
    act(() => {
      mqls.get('768')!.dispatchChange(true);
    });

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('cleans up listeners on unmount', () => {
    installMatchMedia({ mobile: false, tablet: false, portrait: false });

    const { unmount } = renderHook(() => useViewport());

    const mobileMql = mqls.get('480')!;
    const tabletMql = mqls.get('768')!;
    const portraitMql = mqls.get('portrait')!;

    expect(mobileMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(tabletMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(portraitMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mobileMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(tabletMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(portraitMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('handles orientation change to portrait', () => {
    installMatchMedia({ mobile: true, tablet: true, portrait: false });

    const { result } = renderHook(() => useViewport());

    expect(result.current.isLandscape).toBe(true);

    act(() => {
      mqls.get('portrait')!.dispatchChange(true);
    });

    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });
});
