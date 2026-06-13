"use client";

import { type IDBPDatabase, openDB } from "idb";
import { generateUUID } from "@/lib/crypto-utils";

// ─── Types ─────────────────────────────────────────────────────

export interface QueuedMutation {
  /** Unique ID for this queued mutation */
  id: string;
  /** API endpoint to call (e.g. "/api/organizations/org1/customers") */
  endpoint: string;
  /** HTTP method */
  method: "POST" | "PATCH" | "DELETE";
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
}

// ─── IndexedDB Setup ──────────────────────────────────────────

const DB_NAME = "tolom-mutation-queue";
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

// ─── Queue Operations ─────────────────────────────────────────

/**
 * Enqueue a mutation for later replay.
 * Returns the mutation ID for tracking.
 */
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

/**
 * Get all mutations with a given status.
 */
export async function getMutationsByStatus(
  status: QueuedMutation["status"],
): Promise<QueuedMutation[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, "status", status);
}

/**
 * Get all mutations (sorted by creation time).
 */
export async function getAllMutations(): Promise<QueuedMutation[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Get the count of pending mutations.
 */
export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const pending = await db.getAllFromIndex(STORE_NAME, "status", "pending");
  return pending.length;
}

/**
 * Update a mutation's status.
 */
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

/**
 * Remove a single mutation by ID.
 */
export async function removeMutation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

/**
 * Remove all completed or failed mutations older than 7 days.
 */
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

// ─── Replay Engine ────────────────────────────────────────────

export interface ReplayResult {
  completed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Replay all pending mutations in FIFO order.
 * Called when the browser comes back online.
 *
 * Each mutation is retried up to `maxRetries` times with exponential backoff.
 * After max retries, it's marked as failed.
 *
 * @param onInvalidate - Callback to invalidate React Query caches after each success
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

      const res = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await updateMutationStatus(mutation.id, "completed");
      result.completed += 1;

      // Invalidate React Query caches
      if (mutation.queryKeysToInvalidate.length > 0) {
        onInvalidate(mutation.queryKeysToInvalidate);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await updateMutationStatus(mutation.id, "pending", errorMsg);

      // If we haven't exhausted retries, re-enqueue
      if (mutation.retries + 1 < mutation.maxRetries) {
        // Already incremented in updateMutationStatus
      } else {
        await updateMutationStatus(mutation.id, "failed", errorMsg);
        result.failed += 1;
        result.errors.push({ id: mutation.id, error: errorMsg });
      }
    }
  }

  return result;
}
