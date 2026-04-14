import type { RouteObject } from 'react-router-dom';
import { RootLayout } from '@app/router/RootLayout';
import { GameScreen } from '@screens/GameScreen/GameScreen';
import { HomeScreen } from '@screens/HomeScreen/HomeScreen';
import { NotFoundScreen } from '@screens/NotFoundScreen/NotFoundScreen';
import { ProgressScreen } from '@screens/ProgressScreen/ProgressScreen';
import { ResultsScreen } from '@screens/ResultsScreen/ResultsScreen';
import { APP_ROUTE_SEGMENTS } from '@shared/types/routes';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomeScreen />,
      },
      {
        path: APP_ROUTE_SEGMENTS.game,
        element: <GameScreen />,
      },
      {
        path: APP_ROUTE_SEGMENTS.results,
        element: <ResultsScreen />,
      },
      {
        path: APP_ROUTE_SEGMENTS.progress,
        element: <ProgressScreen />,
      },
      {
        path: '*',
        element: <NotFoundScreen />,
      },
    ],
  },
];
