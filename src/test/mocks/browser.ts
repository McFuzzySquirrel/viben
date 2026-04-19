import { vi } from 'vitest';

type MicrophonePermissionState = 'granted' | 'denied' | 'prompt';
type MockAudioContextState = 'running' | 'suspended';

interface BrowserTestMockOptions {
  secureContext?: boolean;
  hasMediaDevices?: boolean;
  hasWebAudio?: boolean;
  permissionState?: MicrophonePermissionState;
  userAgent?: string;
  getUserMediaError?: Error | null;
  audioContextState?: MockAudioContextState;
  localStorageMode?: 'available' | 'unavailable';
  audioFrameValue?: number;
  sampleRate?: number;
  maxTouchPoints?: number;
  visibilityState?: DocumentVisibilityState;
}

interface MockTrack {
  kind: 'audio';
  enabled: boolean;
  readyState: 'live' | 'ended';
  stop: () => void;
}

type PropertyTarget = Window | Navigator | Document;

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();
let activeTrack: MockTrack | null = null;

function rememberDescriptor(targetName: 'window' | 'navigator' | 'document', property: string, target: PropertyTarget) {
  const key = `${targetName}:${property}`;

  if (!originalDescriptors.has(key)) {
    originalDescriptors.set(key, Object.getOwnPropertyDescriptor(target, property));
  }
}

function defineProperty(
  targetName: 'window' | 'navigator' | 'document',
  target: PropertyTarget,
  property: string,
  descriptor: PropertyDescriptor,
) {
  rememberDescriptor(targetName, property, target);
  Object.defineProperty(target, property, {
    configurable: true,
    ...descriptor,
  });
}

function removeProperty(targetName: 'window' | 'navigator' | 'document', target: PropertyTarget, property: string) {
  rememberDescriptor(targetName, property, target);
  Reflect.deleteProperty(target, property);
}

function restoreProperty(targetName: 'window' | 'navigator' | 'document', target: PropertyTarget, property: string) {
  const key = `${targetName}:${property}`;
  const originalDescriptor = originalDescriptors.get(key);

  if (originalDescriptor) {
    Object.defineProperty(target, property, originalDescriptor);
  } else {
    Reflect.deleteProperty(target, property);
  }
}

function createTrack(): MockTrack {
  return {
    kind: 'audio',
    enabled: true,
    readyState: 'live',
    stop() {
      this.readyState = 'ended';
    },
  };
}

function createMediaStream() {
  activeTrack = createTrack();

  return {
    active: true,
    getTracks: () => (activeTrack ? [activeTrack] : []),
    getAudioTracks: () => (activeTrack ? [activeTrack] : []),
  } as unknown as MediaStream;
}

class MockAnalyserNode {
  fftSize = 2048;
  smoothingTimeConstant = 0.1;

  constructor(private readonly audioFrameValue: number) {}

  getFloatTimeDomainData(target: Float32Array) {
    target.fill(this.audioFrameValue);
  }
}

class MockMediaStreamSourceNode {
  connect() {
    return undefined;
  }

  disconnect() {
    return undefined;
  }
}

class MockAudioContext {
  readonly sampleRate: number;
  state: AudioContextState;
  readonly analyserNode: MockAnalyserNode;

  constructor(options: BrowserTestMockOptions) {
    this.sampleRate = options.sampleRate ?? 48_000;
    this.state = (options.audioContextState ?? 'running') as AudioContextState;
    this.analyserNode = new MockAnalyserNode(options.audioFrameValue ?? 0);
  }

  createAnalyser() {
    return this.analyserNode as unknown as AnalyserNode;
  }

  createMediaStreamSource() {
    return new MockMediaStreamSourceNode() as unknown as MediaStreamAudioSourceNode;
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }
}

function createStorageUnavailableError() {
  return new DOMException('localStorage is unavailable in this test.', 'SecurityError');
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

export function installBrowserTestMocks(options: BrowserTestMockOptions = {}) {
  resetBrowserTestMocks();

  const resolvedOptions = {
    secureContext: options.secureContext ?? true,
    hasMediaDevices: options.hasMediaDevices ?? true,
    hasWebAudio: options.hasWebAudio ?? true,
    permissionState: options.permissionState ?? 'prompt',
    userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
    getUserMediaError: options.getUserMediaError ?? null,
    audioContextState: options.audioContextState ?? 'running',
    localStorageMode: options.localStorageMode ?? 'available',
    audioFrameValue: options.audioFrameValue ?? 0,
    sampleRate: options.sampleRate ?? 48_000,
    maxTouchPoints: options.maxTouchPoints ?? 0,
    visibilityState: options.visibilityState ?? ('visible' as DocumentVisibilityState),
  };

  const queryPermissionMock = vi.fn().mockResolvedValue({
    state: resolvedOptions.permissionState,
  });
  const getUserMediaMock = vi.fn().mockImplementation(async () => {
    if (resolvedOptions.getUserMediaError) {
      throw resolvedOptions.getUserMediaError;
    }

    return createMediaStream();
  });
  const AudioContextConstructor = class extends MockAudioContext {
    constructor() {
      super(resolvedOptions);
    }
  };

  defineProperty('window', window, 'isSecureContext', {
    value: resolvedOptions.secureContext,
    writable: true,
  });
  defineProperty('navigator', navigator, 'userAgent', {
    value: resolvedOptions.userAgent,
  });
  defineProperty('navigator', navigator, 'permissions', {
    value: {
      query: queryPermissionMock,
    },
  });
  if (resolvedOptions.hasMediaDevices) {
    defineProperty('navigator', navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
    });
  } else {
    removeProperty('navigator', navigator, 'mediaDevices');
  }

  if (resolvedOptions.hasWebAudio) {
    defineProperty('window', window, 'AudioContext', {
      value: AudioContextConstructor,
    });
    removeProperty('window', window, 'webkitAudioContext');
  } else {
    removeProperty('window', window, 'AudioContext');
    removeProperty('window', window, 'webkitAudioContext');
  }

  if (resolvedOptions.localStorageMode === 'unavailable') {
    defineProperty('window', window, 'localStorage', {
      get() {
        throw createStorageUnavailableError();
      },
    });
  } else {
    defineProperty('window', window, 'localStorage', {
      value: createMemoryStorage(),
    });
  }

  defineProperty('navigator', navigator, 'maxTouchPoints', {
    value: resolvedOptions.maxTouchPoints,
  });

  defineProperty('document', document, 'visibilityState', {
    value: resolvedOptions.visibilityState,
    writable: true,
  });

  return {
    getUserMediaMock,
    queryPermissionMock,
    getActiveTrack: () => activeTrack,
  };
}

export function resetBrowserTestMocks() {
  activeTrack = null;

  restoreProperty('window', window, 'AudioContext');
  restoreProperty('window', window, 'webkitAudioContext');
  restoreProperty('window', window, 'isSecureContext');
  restoreProperty('window', window, 'localStorage');
  restoreProperty('navigator', navigator, 'mediaDevices');
  restoreProperty('navigator', navigator, 'permissions');
  restoreProperty('navigator', navigator, 'userAgent');
  restoreProperty('navigator', navigator, 'maxTouchPoints');
  restoreProperty('document', document, 'visibilityState');
}
