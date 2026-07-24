import { Database, Q, Model } from "@nozbe/watermelondb";
import { supabase } from "@/lib/supabase";

// Tables that participate in sync
const SYNC_TABLES = ["horses", "health_logs", "breeding_records", "listings", "events"] as const;

type SyncTableName = (typeof SYNC_TABLES)[number];

// Tables that have an updated_at column for incremental pull filtering
const TABLES_WITH_UPDATED_AT: ReadonlySet<SyncTableName> = new Set(["horses", "listings"]);

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  error: string | null;
}

export type SyncListener = (status: SyncStatus) => void;

// WatermelonDB internal fields that should not be sent to Supabase
const WM_INTERNAL_FIELDS = ["_status", "_changed", "id"];

// Batch size for Supabase upsert/delete operations
const BATCH_SIZE = 500;

/** Convert ISO string or Date to Unix timestamp (seconds) for WatermelonDB. */
function toTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime() / 1000;
  if (value instanceof Date) return value.getTime() / 1000;
  return Date.now() / 1000;
}

export class SyncEngine {
  private database: Database;
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = {
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    error: null,
  };

  constructor(database: Database) {
    this.database = database;
  }

  /** Subscribe to sync status changes. Returns unsubscribe function. */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Emit current status immediately
    listener({ ...this.status });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.status }));
  }

  /** Count dirty records across all sync tables. */
  async getPendingCount(): Promise<number> {
    let count = 0;
    for (const tableName of SYNC_TABLES) {
      const collection = this.database.get(tableName);
      const dirtyCount = await collection
        .query(Q.where("_status", Q.oneOf(["created", "updated", "deleted"])))
        .fetchCount();
      count += dirtyCount;
    }
    return count;
  }

  // ── Push: local WatermelonDB → Supabase ──────────────────────

  private async push(): Promise<void> {
    for (const tableName of SYNC_TABLES) {
      await this.pushTable(tableName);
    }
  }

  private async pushTable(tableName: SyncTableName): Promise<void> {
    const collection = this.database.get(tableName);
    const dirtyRecords = await collection
      .query(Q.where("_status", Q.oneOf(["created", "updated", "deleted"])))
      .fetch();

    if (dirtyRecords.length === 0) return;

    // Process in batches to avoid Supabase payload limits
    for (let i = 0; i < dirtyRecords.length; i += BATCH_SIZE) {
      const batch = dirtyRecords.slice(i, i + BATCH_SIZE);

      const toDelete = batch.filter((r) => r._raw._status === "deleted");
      const toUpsert = batch.filter((r) => r._raw._status !== "deleted");

      // Upsert non-deleted records
      if (toUpsert.length > 0) {
        const upsertRows = toUpsert.map((r) => this.recordToRow(r));
        const { error } = await supabase
          .from(tableName)
          .upsert(upsertRows, { onConflict: "id" });
        if (error) {
          throw new Error(`Push ${tableName} upsert failed: ${error.message}`);
        }
      }

      // Soft-delete removed records (set is_deleted + sync_status, don't hard-delete)
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map((r) => r.id);
        const { error } = await supabase
          .from(tableName)
          .update({ is_deleted: true, sync_status: "synced" })
          .in("id", deleteIds);
        if (error) {
          throw new Error(`Push ${tableName} soft-delete failed: ${error.message}`);
        }
      }

      // Mark batch as synced locally
      await this.database.write(async () => {
        for (const record of batch) {
          await record.update((r) => {
            r._raw._status = "synced";
            r._raw._changed = "";
            // Keep the user-facing sync_status column in sync
            (r._raw as Record<string, unknown>)["sync_status"] = "synced";
          });
        }
      });
    }
  }

  /** Strip WatermelonDB internal fields, return a plain row for Supabase. */
  private recordToRow(record: Model): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    const raw = record._raw;
    for (const key of Object.keys(raw)) {
      if (WM_INTERNAL_FIELDS.includes(key)) continue;
      row[key] = (raw as Record<string, unknown>)[key];
    }
    return row;
  }

  // ── Pull: Supabase → WatermelonDB ────────────────────────────

  private async pull(lastSyncAt: Date | null): Promise<Date> {
    const now = new Date();

    for (const tableName of SYNC_TABLES) {
      await this.pullTable(tableName, lastSyncAt);
    }

    return now;
  }

  private async pullTable(tableName: SyncTableName, lastSyncAt: Date | null): Promise<void> {
    const collection = this.database.get(tableName);

    // Only filter by updated_at for tables that have that column
    let query = supabase.from(tableName).select("*").eq("is_deleted", false);
    if (lastSyncAt && TABLES_WITH_UPDATED_AT.has(tableName)) {
      query = query.gt("updated_at", lastSyncAt.toISOString());
    }

    const { data: remoteRecords, error } = await query;
    if (error) {
      throw new Error(`Pull ${tableName} failed: ${error.message}`);
    }
    if (!remoteRecords || remoteRecords.length === 0) return;

    // Upsert each remote record into WatermelonDB
    await this.database.write(async () => {
      for (const remote of remoteRecords) {
        const existingRecord = await collection.find(remote.id).catch(() => null);

        if (existingRecord) {
          await existingRecord.update((r) => {
            for (const key of Object.keys(remote)) {
              if (key === "id") continue;
              if (key === "created_at" || key === "updated_at") {
                (r._raw as Record<string, unknown>)[key] = toTimestamp(remote[key]);
                continue;
              }
              (r._raw as Record<string, unknown>)[key] = remote[key];
            }
            r._raw._status = "synced";
            r._raw._changed = "";
          });
        } else {
          await collection.create((r) => {
            for (const key of Object.keys(remote)) {
              if (key === "id") continue;
              if (key === "created_at" || key === "updated_at") {
                (r._raw as Record<string, unknown>)[key] = toTimestamp(remote[key]);
                continue;
              }
              (r._raw as Record<string, unknown>)[key] = remote[key];
            }
            r._raw._status = "synced";
            r._raw._changed = "";
          });
        }
      }
    });
  }

  // ── Public API ───────────────────────────────────────────────

  /** Full sync cycle: push local changes then pull remote changes. */
  async sync(): Promise<void> {
    // Prevent concurrent syncs
    if (this.status.isSyncing) return;

    this.status = { ...this.status, isSyncing: true, error: null };
    this.notify();

    try {
      // Push first: local edits should reach the server before we pull
      await this.push();
      this.status.lastSyncAt = await this.pull(this.status.lastSyncAt);
      this.status.pendingChanges = await this.getPendingCount();
    } catch (err) {
      this.status.error = err instanceof Error ? err.message : "Sync failed";
    } finally {
      this.status.isSyncing = false;
      this.notify();
    }
  }

  /** Sync only: push local dirty records to Supabase (no pull). */
  async pushOnly(): Promise<void> {
    if (this.status.isSyncing) return;

    this.status = { ...this.status, isSyncing: true, error: null };
    this.notify();

    try {
      await this.push();
      this.status.pendingChanges = await this.getPendingCount();
    } catch (err) {
      this.status.error = err instanceof Error ? err.message : "Push failed";
    } finally {
      this.status.isSyncing = false;
      this.notify();
    }
  }

  /** Reset status (useful on logout). */
  reset(): void {
    this.status = {
      isSyncing: false,
      lastSyncAt: null,
      pendingChanges: 0,
      error: null,
    };
    this.notify();
  }
}
