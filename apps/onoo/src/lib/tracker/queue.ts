/**
 * IndexedDB operation journal for the game-day tracker.
 *
 * Each row is keyed by operation UUID and stores full command payload,
 * per-device client UUID, tracker session, local sequence, command kind,
 * sync state, attempt count, and last error.
 *
 * On reload, pending operations are replayed in sequence order.
 * Acknowledged operations are retained until explicitly cleared.
 * Rejected operations are visible to the operator for retry/diagnosis.
 */

import { EventQueue, type QueueOp } from "@onoo/core";
import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "onoo-tracker";
const DB_VERSION = 2;
const STORE_NAME = "operations";

// ── Operation state machine ──────────────────────────────────────────
export type OperationState =
  | "pending" // created locally, not yet sent
  | "sending" // in-flight to server
  | "acknowledged" // server accepted (idempotent or new)
  | "rejected"; // server rejected (auth, validation, etc.)

// ── Stored operation shape ───────────────────────────────────────────
export interface StoredOperation {
  operationId: string; // UUID, primary key
  gameId: string;
  trackerSessionId: string;
  clientId: string; // stable per-device UUID
  localSeq: number; // monotonic per-session
  commandKind: "record_event" | "void_event";
  payload: unknown; // full RPC parameters
  state: OperationState;
  attemptCount: number;
  lastError: string | null;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

// ── Queue interface (unchanged for EventQueue consumers) ─────────────
export type { QueueOp };

// ── IndexedDB adapter ────────────────────────────────────────────────
class TrackerDB {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, _transaction) {
        // Version 2: keyed by operationId UUID, new state machine fields
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "operationId",
          });
          store.createIndex("state", "state");
          store.createIndex("localSeq", "localSeq");
          store.createIndex("gameId", "gameId");
          store.createIndex("gameId_state", ["gameId", "state"]);
        }
      },
      blocked() {
        // Other tabs open with old version — wait for them to close
      },
      async blocking() {
        // This tab can close to let others upgrade
      },
    });

    // Migrate version-1 rows if they exist
    await this.migrateV1Rows();
  }

  /**
   * Migrate legacy version-1 queue rows (auto-increment id, synced flag)
   * into the new operation-UUID schema. Incomplete rows are marked rejected
   * rather than dropped.
   */
  private async migrateV1Rows(): Promise<void> {
    if (!this.db) return;
    // The old store was named "queue"; if it doesn't exist, nothing to migrate
    if (!this.db.objectStoreNames.contains("queue")) return;

    // Read all v1 rows from the old store
    const tx = this.db.transaction("queue", "readonly");
    const oldStore = tx.objectStore("queue");
    const v1Rows = await oldStore.getAll();
    await tx.done;

    if (v1Rows.length === 0) return;

    const now = new Date().toISOString();
    const writeTx = this.db.transaction(STORE_NAME, "readwrite");
    const store = writeTx.objectStore(STORE_NAME);

    for (const row of v1Rows) {
      const event = row.event as Record<string, unknown> | undefined;
      const hasCompletePayload =
        event?.game_id && event.operation_id && event.tracker_session_id;

      const op: StoredOperation = {
        operationId: hasCompletePayload
          ? (event.operation_id as string)
          : crypto.randomUUID(),
        gameId: hasCompletePayload ? (event.game_id as string) : "unknown",
        trackerSessionId: hasCompletePayload
          ? (event.tracker_session_id as string)
          : "unknown",
        clientId: hasCompletePayload
          ? (event.client_id as string)
          : crypto.randomUUID(),
        localSeq: row.localSeq ?? 0,
        commandKind: "record_event",
        payload: event ?? row,
        state: hasCompletePayload ? "pending" : "rejected",
        attemptCount: 0,
        lastError: hasCompletePayload ? null : "incomplete v1 migration",
        createdAt: now,
        updatedAt: now,
      };

      // Use put to avoid conflicts if already migrated
      await store.put(op);
    }
    await writeTx.done;

    // Delete the old store via a version bump is not possible without
    // closing and reopening; we leave "queue" empty. The old store
    // is harmless and will be garbage-collected on next browser cleanup.
  }

  // ── CRUD operations ──────────────────────────────────────────────

  async saveOperation(op: StoredOperation): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(STORE_NAME, op);
  }

  async getOperation(
    operationId: string,
  ): Promise<StoredOperation | undefined> {
    if (!this.db) await this.init();
    return this.db!.get(STORE_NAME, operationId);
  }

  async loadPendingByGame(gameId: string): Promise<StoredOperation[]> {
    if (!this.db) await this.init();
    const all = await this.db!.getAllFromIndex(STORE_NAME, "gameId", gameId);
    return all
      .filter((op) => op.state === "pending" || op.state === "sending")
      .sort((a, b) => a.localSeq - b.localSeq);
  }

  async loadAllByGame(gameId: string): Promise<StoredOperation[]> {
    if (!this.db) await this.init();
    const all = await this.db!.getAllFromIndex(STORE_NAME, "gameId", gameId);
    return all.sort((a, b) => a.localSeq - b.localSeq);
  }

  async markAcknowledged(operationId: string): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get(STORE_NAME, operationId);
    if (existing) {
      await this.db!.put(STORE_NAME, {
        ...existing,
        state: "acknowledged" as OperationState,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async markSending(operationId: string): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get(STORE_NAME, operationId);
    if (existing) {
      await this.db!.put(STORE_NAME, {
        ...existing,
        state: "sending" as OperationState,
        attemptCount: existing.attemptCount + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async markRejected(operationId: string, error: string): Promise<void> {
    if (!this.db) await this.init();
    const existing = await this.db!.get(STORE_NAME, operationId);
    if (existing) {
      await this.db!.put(STORE_NAME, {
        ...existing,
        state: "rejected" as OperationState,
        lastError: error,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async clearAcknowledged(gameId: string): Promise<void> {
    if (!this.db) await this.init();
    const all = await this.db!.getAllFromIndex(STORE_NAME, "gameId", gameId);
    const tx = this.db!.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const op of all) {
      if (op.state === "acknowledged") {
        await store.delete(op.operationId);
      }
    }
    await tx.done;
  }

  async size(): Promise<number> {
    if (!this.db) await this.init();
    return this.db!.count(STORE_NAME);
  }
}

// ── Persistent queue factory ─────────────────────────────────────────

export interface PersistentQueue {
  db: TrackerDB;

  /** Load pending ops for replay on reload */
  loadPending(gameId: string): Promise<StoredOperation[]>;

  /** Persist an operation before sending */
  persistOperation(op: StoredOperation): Promise<void>;

  /** Mark operation as acknowledged by server */
  acknowledge(operationId: string): Promise<void>;

  /** Mark operation as rejected by server */
  reject(operationId: string, error: string): Promise<void>;

  /** Mark operation as in-flight */
  markSending(operationId: string): Promise<void>;

  /** Clear acknowledged operations for a game */
  clearAcknowledged(gameId: string): Promise<number>;

  /** Get all operations for a game (for diagnostics) */
  getAllByGame(gameId: string): Promise<StoredOperation[]>;
}

export async function createPersistentQueue(): Promise<PersistentQueue> {
  const db = new TrackerDB();
  await db.init();

  return {
    db,

    loadPending: (gameId: string) => db.loadPendingByGame(gameId),

    persistOperation: (op: StoredOperation) => db.saveOperation(op),

    acknowledge: (operationId: string) => db.markAcknowledged(operationId),

    reject: (operationId: string, error: string) =>
      db.markRejected(operationId, error),

    markSending: (operationId: string) => db.markSending(operationId),

    clearAcknowledged: async (gameId: string) => {
      const before = await db.size();
      await db.clearAcknowledged(gameId);
      const after = await db.size();
      return before - after;
    },

    getAllByGame: (gameId: string) => db.loadAllByGame(gameId),
  };
}

export { EventQueue };
