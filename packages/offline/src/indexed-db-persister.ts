"use client";

import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "zuiio-query-cache";
const DB_VERSION = 1;
const STORE_NAME = "tanstack-query";
const DB_KEY = "query-cache";

/**
 * IndexedDB adapter for React Query's persistQueryClient.
 *
 * Why IndexedDB over localStorage:
 * - No 5MB size limit (localStorage cap)
 * - Async API (won't block the main thread)
 * - Structured storage (not string-only)
 * - Better quota handling on mobile browsers
 */
function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingClient: PersistedClient | null = null;

/**
 * Debounced write — batches rapid cache updates into a single IndexedDB write.
 * Max debounce: 2 seconds.
 */
function debouncedWrite(client: PersistedClient): void {
  pendingClient = client;
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    if (!pendingClient) return;
    const db = await getDb();
    await db.put(STORE_NAME, pendingClient, DB_KEY);
    pendingClient = null;
  }, 2000);
}

export const indexedDbPersister = {
  persistClient: async (client: PersistedClient) => {
    debouncedWrite(client);
  },

  restoreClient: async (): Promise<PersistedClient | undefined> => {
    const db = await getDb();
    return db.get(STORE_NAME, DB_KEY);
  },

  removeClient: async () => {
    const db = await getDb();
    await db.delete(STORE_NAME, DB_KEY);
  },
};
