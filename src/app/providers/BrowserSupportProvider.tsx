import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import {
  type BrowserSupportState,
  type BrowserSupportTier,
} from '@shared/types/app-shell';
import { PRIVACY_GUARDRAILS, TELEMETRY_ALLOWED } from '@shared/config/privacy';

const BrowserSupportContext = createContext<BrowserSupportState | null>(null);

function detectSupportTier(userAgent: string): BrowserSupportTier {
  const normalizedUserAgent = userAgent.toLowerCase();
  const isFirefox = normalizedUserAgent.includes('firefox');
  const isChromium =
    normalizedUserAgent.includes('chrome') ||
    normalizedUserAgent.includes('chromium') ||
    normalizedUserAgent.includes('edg/');

  if (isChromium) {
    return 'supported';
  }

  if (isFirefox) {
    return 'best-effort';
  }

  return 'unsupported';
}

function canUseLocalStorage(): boolean {
  try {
    const key = '__viben_storage_probe__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function evaluateBrowserSupport(): BrowserSupportState {
  if (typeof window === 'undefined') {
    return {
      tier: 'unsupported',
      isSupported: false,
      missingFeatures: ['Window APIs'],
      supportedBrowsers: ['Chrome', 'Edge', 'Firefox (best effort)'],
      requiresMicrophone: true,
      supportsLocalStorage: false,
      telemetryAllowed: TELEMETRY_ALLOWED,
      privacyGuardrails: PRIVACY_GUARDRAILS,
    };
  }

  const missingFeatures = [
    !navigator.mediaDevices?.getUserMedia ? 'MediaDevices.getUserMedia' : null,
    !('AudioContext' in window || 'webkitAudioContext' in window) ? 'Web Audio API' : null,
    !canUseLocalStorage() ? 'localStorage' : null,
  ].filter((feature): feature is string => feature !== null);

  const tier = detectSupportTier(window.navigator.userAgent);

  return {
    tier,
    isSupported: tier !== 'unsupported' && missingFeatures.length === 0,
    missingFeatures,
    supportedBrowsers: ['Chrome', 'Edge', 'Firefox (best effort)'],
    requiresMicrophone: true,
    supportsLocalStorage: missingFeatures.every((feature) => feature !== 'localStorage'),
    telemetryAllowed: TELEMETRY_ALLOWED,
    privacyGuardrails: PRIVACY_GUARDRAILS,
  };
}

export function BrowserSupportProvider({ children }: PropsWithChildren) {
  const value = useMemo(() => evaluateBrowserSupport(), []);

  return (
    <BrowserSupportContext.Provider value={value}>
      {children}
    </BrowserSupportContext.Provider>
  );
}

export function useBrowserSupport() {
  const context = useContext(BrowserSupportContext);

  if (!context) {
    throw new Error('useBrowserSupport must be used within BrowserSupportProvider.');
  }

  return context;
}
