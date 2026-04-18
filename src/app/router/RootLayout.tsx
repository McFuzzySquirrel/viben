import { NavLink, Outlet } from 'react-router-dom';
import { useBrowserSupport } from '@app/providers/BrowserSupportProvider';
import { APP_NAV_ROUTES } from '@shared/types/routes';

function BrowserSupportBanner() {
  const support = useBrowserSupport();

  if (support.isSupported) {
    return (
      <div className="support-banner support-banner--ok" role="status">
        Desktop Chromium browsers are the primary support target. Firefox is best effort.
      </div>
    );
  }

  return (
    <div className="support-banner support-banner--warning" role="alert">
      <p>
        This prototype requires microphone access, Web Audio, and local storage. Recommended
        browsers: {support.supportedBrowsers.join(', ')}.
      </p>
      {support.missingFeatures.length > 0 ? (
        <p>Missing capabilities: {support.missingFeatures.join(', ')}.</p>
      ) : null}
    </div>
  );
}

export function RootLayout() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="shell__header">
        <div className="brand">
          <img className="brand__logo" src="/viben-logo.png" alt="" />
          <div>
            <p className="brand__eyebrow">Phase 1 foundation</p>
            <h1>Vib&apos;N: Rocket to the Moon</h1>
          </div>
        </div>

        <nav aria-label="Primary">
          <ul className="nav-list">
            {APP_NAV_ROUTES.map((route) => (
              <li key={route.id}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? 'nav-list__link nav-list__link--active' : 'nav-list__link'
                  }
                  to={route.path}
                >
                  {route.navLabel}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <BrowserSupportBanner />

      <main className="shell__content" id="main-content">
        <Outlet />
      </main>

      <footer className="shell__footer">
        <p>Microphone processing remains local-only. No telemetry or ad SDKs are enabled.</p>
      </footer>
    </div>
  );
}
