/**
 * Mutation queue engine — IndexedDB-backed persistence for offline mutations.
 *
 * Mutations are enqueued when offline and replayed in FIFO order when the
 * browser comes back online. Each mutation retries up to `maxRetries` times
 * with exponential backoff before being marked as failed.
 */

import { type IDBPDatabase, openDB } from "idb";

// ─── UUID helper (avoiding external deps) ─────────────────────

function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Types ─────────────────────────────────────────────────────

export interface QueuedMutation {
  /** Unique ID for this queued mutation */
  id: string;
  /** API endpoint to call (e.g. "/api/organizations/org1/customers") */
  endpoint: string;
  /** HTTP method */
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request body (will be JSON.stringify'd) */
  body: unknown;
  /** Query keys to invalidate after successful replay */
  queryKeysToInvalidate: unknown[][];
  /** Timestamp when queued */
  createdAt: number;
  /** Current processing status */
  status: "pending" | "in-flight" | "completed" | "failed";
  /** Number of retry attempts */
  retries: number;
  /** Max retries before giving up */
  maxRetries: number;
  /** Last error message if failed */
  error?: string;
  /**
   * Idempotency key for safe offline replay.
   * When set, the server should reject duplicate requests with the same key.
   * Sent as the `Idempotency-Key` HTTP header during replay.
   * Auto-generated per mutation when not supplied.
   */
  idempotencyKey?: string;
  /**
   * Timestamp when the mutation was claimed for replay (status in-flight).
   * Used to recover mutations stranded by a killed tab/service worker:
   * requeue any in-flight mutation older than IN_FLIGHT_STALE_MS.
   */
  inFlightAt?: number;
}

export interface ReplayResult {
  completed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// ─── Database Setup ────────────────────────────────────────────

const DB_NAME = "zuiio-mutation-queue";
const DB_VERSION = 1;
const STORE_NAME = "mutations";

/**
 * An in-flight mutation older than this is presumed stranded by a killed
 * tab/service worker and is requeued as pending on the next replay.
 */
export const IN_FLIGHT_STALE_MS = 30_000;

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

// ─── Queue Operations ──────────────────────────────────────────

/** Enqueue a mutation for later replay. Returns the mutation ID. */
export async function enqueueMutation(
  mutation: Omit<
    QueuedMutation,
    "id" | "createdAt" | "status" | "retries" | "maxRetries"
  >,
): Promise<string> {
  const db = await getDb();
  const id = generateUUID();
  const record: QueuedMutation = {
    ...mutation,
    id,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
    maxRetries: 3,
    // Every queued mutation gets an idempotency key so replay retries and
    // double-sends (app + service worker racing) dedupe server-side.
    idempotencyKey: mutation.idempotencyKey ?? id,
  };
  await db.put(STORE_NAME, record);
  return id;
}

/** Get all mutations with a given status. */
export async function getMutationsByStatus(
  status: QueuedMutation["status"],
): Promise<QueuedMutation[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, "status", status);
}

/** Get all mutations (sorted by creation time, oldest first). */
export async function getAllMutations(): Promise<QueuedMutation[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

/** Get the count of pending mutations. */
export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const pending = await db.getAllFromIndex(STORE_NAME, "status", "pending");
  return pending.length;
}

/** Remove a single mutation by ID. */
export async function removeMutation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

/** Remove all completed or failed mutations older than 7 days. */
export async function cleanupStaleMutations(): Promise<void> {
  const db = await getDb();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const all = await db.getAll(STORE_NAME);
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const m of all) {
    if (
      (m.status === "completed" || m.status === "failed") &&
      m.createdAt < sevenDaysAgo
    ) {
      tx.store.delete(m.id);
    }
  }
  await tx.done;
}

// ─── Internal helpers ──────────────────────────────────────────

async function updateMutationStatus(
  id: string,
  status: QueuedMutation["status"],
  error?: string,
): Promise<void> {
  const db = await getDb();
  const mutation = await db.get(STORE_NAME, id);
  if (!mutation) return;
  mutation.status = status;
  if (error) mutation.error = error;
  if (status === "pending") mutation.retries += 1;
  // Claim timestamp for stale-in-flight recovery.
  if (status === "in-flight") mutation.inFlightAt = Date.now();
  await db.put(STORE_NAME, mutation);
}

/**
 * Requeue mutations stranded in "in-flight" (a tab or service worker was
 * killed mid-replay). Idempotency keys make the replayed request safe:
 * the server dedupes on them, so a completed-but-acked request is not
 * applied twice.
 */
export async function requeueStaleInFlight(): Promise<number> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  const stale = all.filter(
    (m) =>
      m.status === "in-flight" &&
      Date.now() - (m.inFlightAt ?? m.createdAt) > IN_FLIGHT_STALE_MS,
  );
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const m of stale) {
    m.status = "pending";
    delete m.inFlightAt;
    await tx.store.put(m);
  }
  await tx.done;
  return stale.length;
}

/**
 * Whether an HTTP status should be retried after a failed replay.
 * Network failures (no status) and 408/429/5xx are retryable; 4xx client
 * errors are permanent (invalid payload, auth, forbidden) — retrying them
 * just burns attempts and triggers retry storms.
 */
export function shouldRetryStatus(status: number | undefined): boolean {
  if (status === undefined) return true; // network failure
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

/**
 * Atomically claim a pending mutation for replay: transition pending →
 * in-flight. Returns the claimed record, or null if it is no longer
 * pending (another replay path already claimed it). Prevents double-sends
 * when the app and the service worker replay concurrently.
 */
async function claimMutation(id: string): Promise<QueuedMutation | null> {
  const db = await getDb();
  // One readwrite transaction — the get + put are atomic, so two concurrent
  // replays cannot both claim the same mutation.
  const tx = db.transaction(STORE_NAME, "readwrite");
  const mutation = await tx.store.get(id);
  if (mutation?.status !== "pending") {
    await tx.done;
    return null;
  }
  mutation.status = "in-flight";
  mutation.inFlightAt = Date.now();
  await tx.store.put(mutation);
  await tx.done;
  return mutation;
}

// ─── Replay Engine ─────────────────────────────────────────────

/**
 * Replay all pending mutations in FIFO order.
 * Called when the browser comes back online.
 *
 * Each mutation is retried up to `maxRetries` times. After max retries,
 * it's marked as failed. Mutations stranded in "in-flight" by a killed
 * tab/worker are requeued first (idempotency keys make replay safe).
 * Mutations already claimed in-flight by a concurrent replay (app vs
 * service worker) are skipped to avoid double-sends.
 *
 * @param onInvalidate — Callback to invalidate React Query caches after each success
 */
export async function replayPendingMutations(
  onInvalidate: (queryKeys: unknown[][]) => void,
): Promise<ReplayResult> {
  // Recover mutations left in-flight by a crash — they are stuck otherwise
  // (never read again by any replay path).
  await requeueStaleInFlight();

  const pending = await getMutationsByStatus("pending");
  const result: ReplayResult = { completed: 0, failed: 0, errors: [] };

  for (const mutation of pending) {
    if (mutation.retries >= mutation.maxRetries) {
      await updateMutationStatus(mutation.id, "failed", "Max retries exceeded");
      result.failed += 1;
      result.errors.push({ id: mutation.id, error: "Max retries exceeded" });
      continue;
    }

    try {
      // Safety: only allow relative API paths (no external URLs)
      if (!mutation.endpoint.startsWith("/")) {
        throw new Error(`Invalid endpoint: ${mutation.endpoint}`);
      }

      // Atomic claim: skip if a concurrent replay (another tab or the
      // service worker) already took this mutation in-flight.
      const claimed = await claimMutation(mutation.id);
      if (!claimed) continue;

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
        // Explicit — same-origin cookies (auth) must travel with replay.
        credentials: "same-origin",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        const message = `HTTP ${res.status}: ${text}`;
        if (shouldRetryStatus(res.status)) {
          throw new Error(message);
        }
        // Permanent client error (400/401/403/413) — fail now, don't burn
        // retries on a request that can never succeed.
        await updateMutationStatus(claimed.id, "failed", message);
        result.failed += 1;
        result.errors.push({ id: claimed.id, error: message });
        continue;
      }

      await updateMutationStatus(claimed.id, "completed");
      result.completed += 1;

      if (claimed.queryKeysToInvalidate.length > 0) {
        onInvalidate(claimed.queryKeysToInvalidate);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await updateMutationStatus(mutation.id, "pending", errorMsg);

      if (mutation.retries + 1 >= mutation.maxRetries) {
        await updateMutationStatus(mutation.id, "failed", errorMsg);
        result.failed += 1;
        result.errors.push({ id: mutation.id, error: errorMsg });
      }
    }
  }

  return result;
}
