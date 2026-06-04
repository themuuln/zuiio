"use client";

import { type IDBPDatabase, openDB } from "idb";

// ─── Constants ────────────────────────────────────────────────

const DB_NAME = "tolom-data";
const DB_VERSION = 1;

/**
 * All domain object stores. Each represents a data type that can be
 * cached offline. The IndexedDB key is `id` for single records and
 * `org_id::id` for org-scoped records.
 */
export const STORES = [
  "organizations",
  "branches",
  "customers",
  "vehicles",
  "work-orders",
  "work-order-services",
  "work-order-parts",
  "services",
  "service-catalog",
  "inventory-parts",
  "inventory-movements",
  "inventory-suppliers",
  "inventory-purchase-orders",
  "mechanics",
  "expenses",
  "payroll",
  "service-reminders",
  "communications",
  "notes",
  "vehicle-models",
  "diagnosis-labels",
  "attachments",
  "day-close",
  "dashboard",
  "reports",
  "settings",
  "price-memory",
  "commission-rules",
  "global-catalog",
  "mechanic-hours",
  "mechanic-commissions",
] as const;

export type StoreName = (typeof STORES)[number];

// ─── Types ────────────────────────────────────────────────────

export interface CachedRecord {
  /** Record ID (from the API) */
  id: string;
  /** Organization ID for scoping */
  organization_id: string;
  /** The actual data payload */
  data: unknown;
  /** When this record was cached */
  cachedAt: number;
}

export interface CachedListResponse {
  /** Store name */
  store: StoreName;
  /** Organization ID */
  organization_id: string;
  /** Cache key (includes query params) */
  cacheKey: string;
  /** The list data */
  data: unknown[];
  /** When this response was cached */
  cachedAt: number;
}

// ─── Database Setup ───────────────────────────────────────────

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores for each domain
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("organization_id", "organization_id");
          store.createIndex("cachedAt", "cachedAt");
        }
      }

      // Special store for list responses (keyed by cacheKey)
      if (!db.objectStoreNames.contains("list-responses")) {
        const store = db.createObjectStore("list-responses", {
          keyPath: "cacheKey",
        });
        store.createIndex("organization_id", "organization_id");
        store.createIndex("store", "store");
        store.createIndex("cachedAt", "cachedAt");
      }
    },
  });
}

// ─── Record Operations ────────────────────────────────────────

/**
 * Put a single record into a store.
 */
export async function putRecord(
  store: StoreName,
  record: CachedRecord,
): Promise<void> {
  const db = await getDb();
  await db.put(store, record);
}

/**
 * Put multiple records into a store (batch).
 */
export async function putRecords(
  store: StoreName,
  records: CachedRecord[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(store, "readwrite");
  for (const record of records) {
    tx.store.put(record);
  }
  await tx.done;
}

/**
 * Get all records for an organization from a store.
 */
export async function getOrgRecords(
  store: StoreName,
  orgId: string,
): Promise<CachedRecord[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(store, "organization_id", orgId);
  return all.sort((a, b) => b.cachedAt - a.cachedAt);
}

/**
 * Get a single record by ID.
 */
export async function getRecord(
  store: StoreName,
  id: string,
): Promise<CachedRecord | null> {
  const db = await getDb();
  const record = await db.get(store, id);
  return record ?? null;
}

/**
 * Get multiple records by IDs.
 */
export async function getRecordsByIds(
  store: StoreName,
  ids: string[],
): Promise<CachedRecord[]> {
  const db = await getDb();
  const results: CachedRecord[] = [];
  const tx = db.transaction(store, "readonly");
  for (const id of ids) {
    const record = await tx.store.get(id);
    if (record) results.push(record);
  }
  return results;
}

/**
 * Delete a record by ID.
 */
export async function deleteRecord(
  store: StoreName,
  id: string,
): Promise<void> {
  const db = await getDb();
  await db.delete(store, id);
}

/**
 * Delete multiple records by IDs.
 */
export async function deleteRecords(
  store: StoreName,
  ids: string[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(store, "readwrite");
  for (const id of ids) {
    tx.store.delete(id);
  }
  await tx.done;
}

// ─── List Response Cache ──────────────────────────────────────

/**
 * Cache a list API response (keyed by store + cacheKey).
 */
export async function putListResponse(
  response: CachedListResponse,
): Promise<void> {
  const db = await getDb();
  await db.put("list-responses", response);
}

/**
 * Get a cached list response.
 */
export async function getListResponse(
  cacheKey: string,
): Promise<CachedListResponse | null> {
  const db = await getDb();
  const response = await db.get("list-responses", cacheKey);
  return response ?? null;
}

/**
 * Get all cached list responses for a store + org.
 */
export async function getOrgListResponses(
  store: StoreName,
  orgId: string,
): Promise<CachedListResponse[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(
    "list-responses",
    "organization_id",
    orgId,
  );
  return all.filter((r) => r.store === store);
}

// ─── Bulk Operations ──────────────────────────────────────────

/**
 * Clear all data for an organization (on logout).
 */
export async function clearOrgData(orgId: string): Promise<void> {
  const db = await getDb();

  // Clear records from all stores
  for (const storeName of STORES) {
    const tx = db.transaction(storeName, "readwrite");
    const index = tx.store.index("organization_id");
    const keys = await index.getAllKeys(orgId);
    for (const key of keys) {
      tx.store.delete(key);
    }
    await tx.done;
  }

  // Clear list responses for this org
  const listTx = db.transaction("list-responses", "readwrite");
  const listIndex = listTx.store.index("organization_id");
  const listKeys = await listIndex.getAllKeys(orgId);
  for (const key of listKeys) {
    listTx.store.delete(key);
  }
  await listTx.done;
}

/**
 * Clear ALL data (full reset).
 */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  for (const storeName of STORES) {
    await db.clear(storeName);
  }
  await db.clear("list-responses");
}

/**
 * Get approximate storage usage in bytes.
 */
export async function getStorageEstimate(): Promise<{
  used: number;
  quota: number;
  percent: number;
}> {
  if (!navigator.storage?.estimate) {
    return { used: 0, quota: 0, percent: 0 };
  }
  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
    percent: ((estimate.usage ?? 0) / (estimate.quota ?? 1)) * 100,
  };
}
