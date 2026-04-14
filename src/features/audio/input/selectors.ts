import type { AudioInputSnapshot, AudioSetupStatus } from './types';

export function selectAudioSetupStatus(snapshot: AudioInputSnapshot): AudioSetupStatus {
  if (!snapshot.support.isSupported || snapshot.permission === 'unsupported') {
    return {
      stage: 'unsupported',
      blockedReason: snapshot.blockedReason,
      isBlocked: true,
      isListening: false,
      isReadyForGameplay: false,
      canRequestAccess: false,
      canRetry: false,
    };
  }

  if (snapshot.permission === 'requesting') {
    return {
      stage: 'requesting',
      blockedReason: null,
      isBlocked: false,
      isListening: false,
      isReadyForGameplay: false,
      canRequestAccess: false,
      canRetry: false,
    };
  }

  if (snapshot.readiness === 'capturing') {
    return {
      stage: 'capturing',
      blockedReason: null,
      isBlocked: false,
      isListening: true,
      isReadyForGameplay: true,
      canRequestAccess: true,
      canRetry: false,
    };
  }

  if (snapshot.readiness === 'ready' || snapshot.permission === 'granted') {
    return {
      stage: 'ready',
      blockedReason: null,
      isBlocked: false,
      isListening: false,
      isReadyForGameplay: true,
      canRequestAccess: true,
      canRetry: false,
    };
  }

  if (snapshot.readiness === 'blocked' || snapshot.permission === 'denied') {
    return {
      stage: 'blocked',
      blockedReason: snapshot.blockedReason,
      isBlocked: true,
      isListening: false,
      isReadyForGameplay: false,
      canRequestAccess: snapshot.support.isSupported,
      canRetry: true,
    };
  }

  if (snapshot.readiness === 'error' || snapshot.permission === 'error') {
    return {
      stage: 'error',
      blockedReason: snapshot.blockedReason,
      isBlocked: false,
      isListening: false,
      isReadyForGameplay: false,
      canRequestAccess: snapshot.support.isSupported,
      canRetry: true,
    };
  }

  return {
    stage: 'idle',
    blockedReason: null,
    isBlocked: false,
    isListening: false,
    isReadyForGameplay: false,
    canRequestAccess: snapshot.support.isSupported,
    canRetry: false,
  };
}
