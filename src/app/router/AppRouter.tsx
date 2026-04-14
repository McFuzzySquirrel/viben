import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { appRoutes } from '@app/router/route-config';

const router = createBrowserRouter(appRoutes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
