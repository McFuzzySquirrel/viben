import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppProviders } from '@app/providers/AppProviders';
import { appRoutes } from '@app/router/route-config';
import { APP_ROUTE_PATHS, type AppRoutePath } from '@shared/types/routes';

export function renderApp(initialEntry: AppRoutePath = APP_ROUTE_PATHS.home) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  return {
    router,
    ...render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}
