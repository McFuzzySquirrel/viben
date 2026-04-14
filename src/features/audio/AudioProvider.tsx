import { createContext, useContext, type PropsWithChildren } from 'react';
import { useMicrophoneInput, type MicrophoneInputController } from './input';

const AudioInputContext = createContext<MicrophoneInputController | null>(null);

export function AudioProvider({ children }: PropsWithChildren) {
  const microphone = useMicrophoneInput();

  return <AudioInputContext.Provider value={microphone}>{children}</AudioInputContext.Provider>;
}

export function useAudioInput() {
  const context = useContext(AudioInputContext);

  if (!context) {
    throw new Error('useAudioInput must be used within AudioProvider.');
  }

  return context;
}
