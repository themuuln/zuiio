"use client";

import type { CachedListResponse, CachedRecord, StoreName } from "./idb-store";
import {
  clearOrgData,
  getListResponse,
  putListResponse,
  putRecord,
  putRecords,
} from "./idb-store";

// ─── Sync Helpers ─────────────────────────────────────────────

/**
 * Cache a single record from an API response.
 */
export async function syncRecord(
  store: StoreName,
  orgId: string,
  record: unknown,
): Promise<void> {
  const r = record as Record<string, unknown>;
  await putRecord(store, {
    id: String(r.id ?? r.record_id ?? ""),
    organization_id: orgId,
    data: record,
    cachedAt: Date.now(),
  });
}

/**
 * Cache multiple records from an API list response.
 */
export async function syncRecords(
  store: StoreName,
  orgId: string,
  records: unknown[],
): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;

  const cached: CachedRecord[] = records
    .filter(
      (r): r is Record<string, unknown> => typeof r === "object" && r !== null,
    )
    .map((r) => ({
      id: String(r.id ?? r.record_id ?? ""),
      organization_id: orgId,
      data: r,
      cachedAt: Date.now(),
    }));

  if (cached.length > 0) {
    await putRecords(store, cached);
  }
}

/**
 * Cache a list API response (for query-level caching).
 * The cacheKey includes the full API path + query params.
 */
export async function syncListResponse(
  store: StoreName,
  orgId: string,
  cacheKey: string,
  data: unknown[],
): Promise<void> {
  await putListResponse({
    store,
    organization_id: orgId,
    cacheKey,
    data,
    cachedAt: Date.now(),
  });
}

/**
 * Get a cached list response by cacheKey.
 */
export async function getCachedList(
  cacheKey: string,
): Promise<CachedListResponse | null> {
  return getListResponse(cacheKey);
}

/**
 * Sync a full API response to IndexedDB.
 * Handles both direct array and paginated (json.data.data) shapes.
 */
export async function syncApiResponse(
  store: StoreName,
  orgId: string,
  apiPath: string,
  params: Record<string, string | number | boolean | undefined> | undefined,
  json: unknown,
): Promise<void> {
  const data = json as Record<string, unknown>;
  const payload = data?.data;

  // Build the cache key from path + params
  let cacheKey = `${orgId}::${apiPath}`;
  if (params) {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    if (sorted) cacheKey += `?${sorted}`;
  }

  if (Array.isArray(payload)) {
    // Direct array response
    await syncRecords(store, orgId, payload);
    await syncListResponse(store, orgId, cacheKey, payload);
  } else if (payload && typeof payload === "object" && "data" in payload) {
    // Paginated response: { data: [...], total: N }
    const list = (payload as Record<string, unknown>).data;
    if (Array.isArray(list)) {
      await syncRecords(store, orgId, list);
      await syncListResponse(store, orgId, cacheKey, list);
    }
  } else if (payload && typeof payload === "object") {
    // Single object response
    await syncRecord(store, orgId, payload);
  }
}

/**
 * Clear all cached data for an organization (on logout).
 */
export async function clearCachedOrg(orgId: string): Promise<void> {
  await clearOrgData(orgId);
}
