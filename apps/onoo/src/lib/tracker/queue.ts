/**
 * IndexedDB adapter for EventQueue
 * Wraps the pure EventQueue with persistent storage
 */

import { openDB, type IDBPDatabase } from "idb";
import { EventQueue, type QueueOp } from "@onoo/core";

const DB_NAME = "onoo-tracker";
const DB_VERSION = 1;
const STORE_NAME = "queue";

interface StoredOp {
  id?: number;
  kind: "insert" | "soft_delete";
  event?: unknown;
  eventId?: string;
  localSeq: number;
  synced: boolean;
}

class TrackerDB {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("synced", "synced");
          store.createIndex("localSeq", "localSeq");
        }
      },
    });
  }

  async loadPending(): Promise<QueueOp[]> {
    if (!this.db) await this.init();
    const ops = await this.db!.getAllFromIndex(STORE_NAME, "synced", 0);
    return ops
      .filter((op) => !op.synced)
      .sort((a, b) => a.localSeq - b.localSeq)
      .map((op) => ({
        kind: op.kind as "insert" | "soft_delete",
        event: op.event as QueueOp["event"],
        eventId: op.eventId,
        localSeq: op.localSeq,
      }));
  }

  async saveOp(op: QueueOp, localSeq: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.add(STORE_NAME, {
      kind: op.kind,
      event: op.event ?? null,
      eventId: op.eventId ?? null,
      localSeq,
      synced: 0,
    });
  }

  async markSynced(clientIds: string[]): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("synced");

    let cursor = await index.openCursor();
    while (cursor) {
      const op = cursor.value as StoredOp;
      if (!op.synced) {
        const clientId =
          op.kind === "insert" && op.event
            ? (op.event as { client_id?: string })?.client_id
            : op.eventId;
        if (clientId && clientIds.includes(clientId)) {
          await cursor.update({ ...op, synced: 1 });
        }
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async clearSynced(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("synced");

    let cursor = await index.openCursor();
    while (cursor) {
      if ((cursor.value as StoredOp).synced) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async size(): Promise<number> {
    if (!this.db) await this.init();
    return this.db!.count(STORE_NAME);
  }
}

/**
 * Create a persistent EventQueue backed by IndexedDB
 */
export async function createPersistentQueue(): Promise<{
  queue: EventQueue;
  db: TrackerDB;
  hydrate: () => Promise<void>;
  persist: (op: QueueOp, localSeq: number) => Promise<void>;
  markSynced: (clientIds: string[]) => Promise<void>;
}> {
  const db = new TrackerDB();
  await db.init();

  const queue = new EventQueue();

  // Load pending ops from IndexedDB
  const pending = await db.loadPending();
  for (const op of pending) {
    queue.enqueue(op);
  }

  return {
    queue,
    db,
    hydrate: async () => {
      const ops = await db.loadPending();
      // Re-enqueue unsynced ops
      for (const op of ops) {
        queue.enqueue(op);
      }
    },
    persist: async (op: QueueOp, localSeq: number) => {
      await db.saveOp(op, localSeq);
    },
    markSynced: async (clientIds: string[]) => {
      await db.markSynced(clientIds);
    },
  };
}

export { EventQueue };
export type { QueueOp };
