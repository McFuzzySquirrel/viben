import type { PropsWithChildren } from 'react';
import { BrowserSupportProvider } from '@app/providers/BrowserSupportProvider';
import { DifficultySelectionProvider } from '@features/settings';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserSupportProvider>
      <DifficultySelectionProvider>{children}</DifficultySelectionProvider>
    </BrowserSupportProvider>
  );
}
