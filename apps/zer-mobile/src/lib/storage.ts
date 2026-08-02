import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tiny KV abstraction so the data layer is storage-agnostic:
 * the app uses AsyncStorage (bundled in Expo Go); unit tests use
 * in-memory fakes.
 */

export interface KvStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const appStorage: KvStorage = AsyncStorage;

export function createMemoryStorage(seed?: Record<string, string>): KvStorage {
  const map = new Map(Object.entries(seed ?? {}));
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

export async function storageGetJson<T>(
  storage: KvStorage,
  key: string,
): Promise<T | null> {
  const raw = await storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSetJson(
  storage: KvStorage,
  key: string,
  value: unknown,
): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}
