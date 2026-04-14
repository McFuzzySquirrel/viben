import { AppProviders } from '@app/providers/AppProviders';
import { AppRouter } from '@app/router/AppRouter';

export function AppShell() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
