import type { PropsWithChildren } from 'react';
import { BrowserSupportProvider } from '@app/providers/BrowserSupportProvider';
import { AudioProvider } from '@features/audio';
import { DifficultySelectionProvider } from '@features/settings';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserSupportProvider>
      <DifficultySelectionProvider>
        <AudioProvider>{children}</AudioProvider>
      </DifficultySelectionProvider>
    </BrowserSupportProvider>
  );
}
