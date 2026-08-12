/// <reference lib="webworker" />
/**
 * Service worker entry — built by Serwist (@serwist/turbopack) at `next build`
 * time and served at /serwist/sw.js (see src/app/serwist/[path]/route.ts).
 * Works under Turbopack builds (unlike next-pwa).
 *
 * Part 1 is the standard Serwist app-shell setup (precache + defaultCache
 * runtime caching). Part 2 adds a Background Sync handler that replays the
 * offline mutation queue (`zuiio-mutation-queue` IndexedDB) when
 * connectivity returns — even if the tab that enqueued the mutations is
 * closed. It mirrors the app-side replay engine in @zuiio/offline
 * mutation-queue.ts so both contexts share the same records safely.
 */

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// `self` is typed as `WorkerGlobalScope` by lib.webworker; the SW runtime
// provides the ServiceWorkerGlobalScope members below.
const sw = self as unknown as ServiceWorkerGlobalScope;

// ── Background sync: offline mutation replay ──────────────────

const QUEUE_DB = "zuiio-mutation-queue";
const QUEUE_STORE = "mutations";
const SYNC_TAG = "sync-mutations";
const SYNCED_MESSAGE = "MUTATIONS_SYNCED";

interface QueuedMutationRow {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  queryKeysToInvalidate: unknown[][];
  createdAt: number;
  status: "pending" | "in-flight" | "completed" | "failed";
  retries: number;
  maxRetries: number;
  error?: string;
  idempotencyKey?: string;
  inFlightAt?: number;
}

/** An in-flight mutation older than this is presumed stranded (killed tab/SW). */
const IN_FLIGHT_STALE_MS = 30_000;

/** Whether an HTTP status should be retried (mirrors the app engine). */
function shouldRetryStatus(status: number | undefined): boolean {
  if (status === undefined) return true; // network failure
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

/** Atomically claim a pending mutation for replay (pending → in-flight). */
async function claimRecord(
  db: IDBDatabase,
  id: string,
): Promise<QueuedMutationRow | null> {
  // One readwrite transaction — get + put are atomic, so the app and the
  // service worker cannot both claim the same mutation.
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  const { promise, resolve, reject } =
    Promise.withResolvers<QueuedMutationRow | null>();
  const getReq = tx.objectStore(QUEUE_STORE).get(id);
  getReq.onsuccess = () => {
    const record = getReq.result as QueuedMutationRow | undefined;
    if (record?.status !== "pending") {
      resolve(null);
      return;
    }
    record.status = "in-flight";
    record.inFlightAt = Date.now();
    const putReq = tx.objectStore(QUEUE_STORE).put(record);
    putReq.onsuccess = () => resolve(record);
    putReq.onerror = () => reject(putReq.error);
  };
  getReq.onerror = () => reject(getReq.error);
  tx.oncomplete = () => resolve(null); // no-op if already resolved
  return promise;
}

function openQueueDb(): Promise<IDBDatabase> {
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
  const req = indexedDB.open(QUEUE_DB, 1);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
  return promise;
}

function getPending(db: IDBDatabase): Promise<QueuedMutationRow[]> {
  const { promise, resolve, reject } =
    Promise.withResolvers<QueuedMutationRow[]>();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const index = tx.objectStore(QUEUE_STORE).index("status");
  const req = index.getAll("pending");
  req.onsuccess = () => resolve((req.result ?? []) as QueuedMutationRow[]);
  req.onerror = () => reject(req.error);
  return promise;
}

function getAllRecords(db: IDBDatabase): Promise<QueuedMutationRow[]> {
  const { promise, resolve, reject } =
    Promise.withResolvers<QueuedMutationRow[]>();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const req = tx.objectStore(QUEUE_STORE).getAll();
  req.onsuccess = () => resolve((req.result ?? []) as QueuedMutationRow[]);
  req.onerror = () => reject(req.error);
  return promise;
}

function getRecord(
  db: IDBDatabase,
  id: string,
): Promise<QueuedMutationRow | null> {
  const { promise, resolve, reject } =
    Promise.withResolvers<QueuedMutationRow | null>();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const req = tx.objectStore(QUEUE_STORE).get(id);
  req.onsuccess = () => resolve((req.result as QueuedMutationRow) ?? null);
  req.onerror = () => reject(req.error);
  return promise;
}

function putRecord(db: IDBDatabase, record: QueuedMutationRow): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).put(record);
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  return promise;
}

function deleteRecord(db: IDBDatabase, id: string): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).delete(id);
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  return promise;
}

async function setStatus(
  db: IDBDatabase,
  id: string,
  status: QueuedMutationRow["status"],
  error?: string,
): Promise<void> {
  const record = await getRecord(db, id);
  if (!record) return;
  record.status = status;
  if (error) record.error = error;
  // Mirror app engine: retries increment only on return to pending.
  if (status === "pending") record.retries += 1;
  await putRecord(db, record);
}

async function replayMutations(): Promise<{
  completed: number;
  failed: number;
  queryKeys: unknown[][];
}> {
  const db = await openQueueDb();
  try {
    // Recover mutations stranded in-flight by a killed tab/SW. Idempotency
    // keys make the replayed request safe against double-application.
    const all = await getAllRecords(db);
    const stale = all.filter(
      (m) =>
        m.status === "in-flight" &&
        Date.now() - (m.inFlightAt ?? m.createdAt) > IN_FLIGHT_STALE_MS,
    );
    for (const m of stale) {
      m.status = "pending";
      delete m.inFlightAt;
      await putRecord(db, m);
    }

    const pending = (await getPending(db)).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    let completed = 0;
    let failed = 0;
    const queryKeys: unknown[][] = [];

    for (const mutation of pending) {
      if (mutation.retries >= mutation.maxRetries) {
        await setStatus(db, mutation.id, "failed", "Max retries exceeded");
        failed += 1;
        continue;
      }
      // Safety: only relative API paths (no external URLs).
      if (!mutation.endpoint?.startsWith("/")) {
        await setStatus(db, mutation.id, "failed", "Invalid endpoint");
        failed += 1;
        continue;
      }

      // Atomic claim — skip if the app (or another replay) took it first.
      const claimed = await claimRecord(db, mutation.id);
      if (!claimed) continue;

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (claimed.idempotencyKey) {
          headers["Idempotency-Key"] = claimed.idempotencyKey;
        }

        const res = await fetch(claimed.endpoint, {
          method: claimed.method,
          headers,
          body: claimed.body ? JSON.stringify(claimed.body) : undefined,
          credentials: "same-origin",
        });

        if (!res.ok) {
          const message = `HTTP ${res.status}`;
          if (!shouldRetryStatus(res.status)) {
            // Permanent client error — fail now, don't burn retries.
            await setStatus(db, claimed.id, "failed", message);
            failed += 1;
            continue;
          }
          throw new Error(message);
        }

        await deleteRecord(db, claimed.id);
        completed += 1;
        queryKeys.push(...(claimed.queryKeysToInvalidate ?? []));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (mutation.retries + 1 >= mutation.maxRetries) {
          await setStatus(db, mutation.id, "failed", message);
          failed += 1;
        } else {
          await setStatus(db, mutation.id, "pending", message);
        }
      }
    }

    return { completed, failed, queryKeys };
  } finally {
    db.close();
  }
}

function notifyClients(result: {
  completed: number;
  failed: number;
  queryKeys: unknown[][];
}): Promise<void> {
  return sw.clients.matchAll({ type: "window" }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ type: SYNCED_MESSAGE, ...result });
    }
  });
}

sw.addEventListener("sync", (event) => {
  const syncEvent = event as unknown as {
    tag: string;
    waitUntil: (p: Promise<unknown>) => void;
  };
  if (syncEvent.tag !== SYNC_TAG) return;

  syncEvent.waitUntil(
    (async () => {
      // If a tab is open, its MutationQueueProvider replays on the browser's
      // online event — skip here to avoid double-sending. Only replay when no
      // window client can do the work (tab closed or PWA backgrounded out).
      const clients = await sw.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (clients.length > 0) return;

      const result = await replayMutations();
      await notifyClients(result);
    })(),
  );
});

// Allow the page to trigger an immediate replay ("Sync now").
sw.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type !== "SYNC_MUTATIONS_NOW") return;

  event.waitUntil(replayMutations().then((result) => notifyClients(result)));
});
