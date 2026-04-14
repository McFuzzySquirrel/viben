import type { PropsWithChildren } from 'react';
import { BrowserSupportProvider } from '@app/providers/BrowserSupportProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return <BrowserSupportProvider>{children}</BrowserSupportProvider>;
}
