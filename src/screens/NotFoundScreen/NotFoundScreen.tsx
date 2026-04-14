import { Link } from 'react-router-dom';
import { APP_ROUTE_PATHS } from '@shared/types/routes';

export function NotFoundScreen() {
  return (
    <section className="screen">
      <p className="screen__eyebrow">Missing route</p>
      <h2>That screen is outside the Phase 1 shell.</h2>
      <p className="screen__lead">
        Return to the supported foundation routes to continue wiring the prototype.
      </p>
      <Link className="button" to={APP_ROUTE_PATHS.home}>
        Go home
      </Link>
    </section>
  );
}
