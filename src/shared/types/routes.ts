export const APP_ROUTE_SEGMENTS = {
  game: 'game',
  progress: 'progress',
  results: 'results',
} as const;

export const APP_ROUTE_PATHS = {
  home: '/',
  game: `/${APP_ROUTE_SEGMENTS.game}`,
  results: `/${APP_ROUTE_SEGMENTS.results}`,
  progress: `/${APP_ROUTE_SEGMENTS.progress}`,
} as const;

export const APP_ROUTE_IDS = ['home', 'game', 'results', 'progress'] as const;

export type AppRouteId = (typeof APP_ROUTE_IDS)[number];
export type AppRoutePath = (typeof APP_ROUTE_PATHS)[AppRouteId];

export interface AppRouteDefinition {
  id: AppRouteId;
  path: AppRoutePath;
  navLabel: string;
  title: string;
  description: string;
}

export const APP_NAV_ROUTES: ReadonlyArray<AppRouteDefinition> = [
  {
    id: 'home',
    path: APP_ROUTE_PATHS.home,
    navLabel: 'Home',
    title: 'Home shell',
    description: 'Entry point for launch, setup, and navigation.',
  },
  {
    id: 'game',
    path: APP_ROUTE_PATHS.game,
    navLabel: 'Game',
    title: 'Game shell',
    description: 'Placeholder route for the active run and setup flow.',
  },
  {
    id: 'results',
    path: APP_ROUTE_PATHS.results,
    navLabel: 'Results',
    title: 'Results shell',
    description: 'Placeholder route for run summaries and replay actions.',
  },
  {
    id: 'progress',
    path: APP_ROUTE_PATHS.progress,
    navLabel: 'Progress',
    title: 'Progress',
    description: 'Placeholder route for local history and comparison.',
  },
] as const;
