export type StorageIssueCode = 'storage-unavailable' | 'invalid-json' | 'write-failed';

interface JsonStorageReadResult {
  value: unknown;
  hasStoredValue: boolean;
  issue: StorageIssueCode | null;
}

function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readJsonFromStorage(key: string, storage?: Storage | null): JsonStorageReadResult {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return {
      value: null,
      hasStoredValue: false,
      issue: 'storage-unavailable',
    };
  }

  try {
    const rawValue = resolvedStorage.getItem(key);

    if (rawValue === null) {
      return {
        value: null,
        hasStoredValue: false,
        issue: null,
      };
    }

    return {
      value: JSON.parse(rawValue),
      hasStoredValue: true,
      issue: null,
    };
  } catch {
    return {
      value: null,
      hasStoredValue: true,
      issue: 'invalid-json',
    };
  }
}

export function writeJsonToStorage(
  key: string,
  value: unknown,
  storage?: Storage | null,
): StorageIssueCode | null {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return 'storage-unavailable';
  }

  try {
    resolvedStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return 'write-failed';
  }
}
