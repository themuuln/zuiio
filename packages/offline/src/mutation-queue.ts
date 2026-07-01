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
   */
  idempotencyKey?: string;
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
  await db.put(STORE_NAME, mutation);
}

// ─── Replay Engine ─────────────────────────────────────────────

/**
 * Replay all pending mutations in FIFO order.
 * Called when the browser comes back online.
 *
 * Each mutation is retried up to `maxRetries` times. After max retries,
 * it's marked as failed.
 *
 * @param onInvalidate — Callback to invalidate React Query caches after each success
 */
export async function replayPendingMutations(
  onInvalidate: (queryKeys: unknown[][]) => void,
): Promise<ReplayResult> {
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

      await updateMutationStatus(mutation.id, "in-flight");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (mutation.idempotencyKey) {
        headers["Idempotency-Key"] = mutation.idempotencyKey;
      }

      const res = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers,
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await updateMutationStatus(mutation.id, "completed");
      result.completed += 1;

      if (mutation.queryKeysToInvalidate.length > 0) {
        onInvalidate(mutation.queryKeysToInvalidate);
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
