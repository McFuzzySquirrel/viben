import { RouterProvider, createHashRouter } from 'react-router-dom';
import { appRoutes } from '@app/router/route-config';

const router = createHashRouter(appRoutes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
