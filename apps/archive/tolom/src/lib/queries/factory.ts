/**
 * Query factory — eliminates repeated fetch+unwrap boilerplate across hooks.
 * Now with offline support: writes to IndexedDB on fetch, reads from IndexedDB when offline.
 *
 * @example
 * ```ts
 * const fetchCustomer = createOrgQuery<Customer>("/customers");
 * // In hook: queryFn: () => fetchCustomer(orgId)
 *
 * const fetchCustomers = createOrgQuery<Customer[]>("/customers", { unwrap: "paginated" });
 * // In hook: queryFn: () => fetchCustomers(orgId, { q: search })
 * ```
 */

import { handleAuthRedirect } from "@/lib/auth-redirect";
import type { StoreName } from "@/lib/offline/idb-store";
import {
  getListResponse,
  putListResponse,
  putRecord,
  putRecords,
} from "@/lib/offline/idb-store";
import { getStoreForPath } from "@/lib/offline/path-to-store";

type UnwrapMode = "direct" | "paginated";

interface FetchOptions {
  /** Additional query parameters. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Custom error message. */
  errorMessage?: string;
  /**
   * IndexedDB store name for offline caching.
   * When set, responses are cached in IndexedDB and served when offline.
   */
  offlineStore?: StoreName;
  /**
   * Extra params to include in the IndexedDB cache key (beyond orgId + path).
   * Use when the same endpoint serves different data based on query params
   * (e.g. `/reports?type=eod` vs `/reports?type=trend`).
   */
  cacheKeyParams?: Record<string, string | number | boolean>;
}

/**
 * Create a fetcher for an org-scoped API endpoint.
 * Handles: fetch → check response → unwrap JSON → type assert.
 * When `offlineStore` is set, also handles offline caching.
 *
 * @param path - API path relative to `/api/organizations/:orgId` (e.g., `"/customers"`)
 * @param options.unwrap - `"direct"` returns `json.data` (default). `"paginated"` returns `json.data?.data ?? json.data ?? []`.
 */
export function createOrgQuery<T>(
  path: string,
  options?: { unwrap?: UnwrapMode },
) {
  const unwrap = options?.unwrap ?? "direct";

  return async (orgId: string, fetchOpts?: FetchOptions): Promise<T> => {
    const url = buildUrl(orgId, path, fetchOpts?.params);
    // Auto-detect store from path if not explicitly provided
    const store = fetchOpts?.offlineStore ?? getStoreForPath(path);
    const cacheKeyParams = fetchOpts?.cacheKeyParams;

    // Try network first
    if (typeof indexedDB !== "undefined" && navigator.onLine) {
      try {
        const res = await fetch(url);
        // Redirect to login on expired session (server sets X-Auth-Required on 401)
        if (handleAuthRedirect(res)) throw new Error("Session expired");

        if (!res.ok) {
          throw new Error(
            fetchOpts?.errorMessage ??
              `Failed to load ${path.split("/").pop()}`,
          );
        }

        const json = await res.json();

        if (json.error) {
          throw new Error(json.error.message);
        }

        const data =
          unwrap === "paginated"
            ? ((json.data?.data ?? json.data ?? []) as T)
            : (json.data as T);

        // Cache to IndexedDB for offline use (strip query params so all
        // variants of the same endpoint share one cache entry,
        // unless cacheKeyParams are provided for type-specific caching)
        if (store && typeof indexedDB !== "undefined") {
          const baseCacheKey = buildCacheKey(orgId, path, cacheKeyParams);
          cacheToIndexedDB(store, orgId, baseCacheKey, data).catch(() => {
            // Silently ignore cache write failures
          });
        }

        return data;
      } catch (err) {
        // Network failed — try IndexedDB fallback (strip query params)
        if (store && typeof indexedDB !== "undefined") {
          const baseCacheKey = buildCacheKey(orgId, path, cacheKeyParams);
          const cached = await getFromIndexedDB<T>(store, baseCacheKey);
          if (cached !== null) return cached;
        }
        throw err;
      }
    }

    // Offline — read from IndexedDB (strip query params)
    if (store && typeof indexedDB !== "undefined") {
      const baseCacheKey = buildCacheKey(orgId, path, cacheKeyParams);
      const cached = await getFromIndexedDB<T>(store, baseCacheKey);
      if (cached !== null) return cached;
    }

    throw new Error(
      fetchOpts?.errorMessage ??
        `Failed to load ${path.split("/").pop()} (offline, no cache)`,
    );
  };
}

// ─── IndexedDB Helpers ────────────────────────────────────────

/**
 * Build a deterministic cache key from orgId + path + params.
 */
function buildCacheKey(
  orgId: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  let key = `${orgId}::${path}`;
  if (params) {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    if (sorted) key += `?${sorted}`;
  }
  return key;
}

/**
 * Cache a successful API response to IndexedDB.
 */

async function cacheToIndexedDB<T>(
  store: StoreName,
  orgId: string,
  cacheKey: string,
  data: T,
): Promise<void> {
  if (Array.isArray(data)) {
    // List response — cache individual records + the list
    const records = data
      .filter(
        (r): r is Record<string, unknown> =>
          typeof r === "object" && r !== null && "id" in r,
      )
      .map((r) => ({
        id: String(r.id),
        organization_id: orgId,
        data: r,
        cachedAt: Date.now(),
      }));

    if (records.length > 0) {
      await putRecords(store, records);
    }

    await putListResponse({
      store,
      organization_id: orgId,
      cacheKey,
      data,
      cachedAt: Date.now(),
    });
  } else if (data && typeof data === "object" && "id" in (data as object)) {
    // Single record
    const r = data as Record<string, unknown>;
    await putRecord(store, {
      id: String(r.id),
      organization_id: orgId,
      data,
      cachedAt: Date.now(),
    });
  }
}

/**
 * Read a cached response from IndexedDB.
 */
async function getFromIndexedDB<T>(
  _store: StoreName,
  cacheKey: string,
): Promise<T | null> {
  // Try list-response cache first (most specific)
  const listResponse = await getListResponse(cacheKey);
  if (listResponse) {
    return listResponse.data as T;
  }

  return null;
}

function buildUrl(
  orgId: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  let url = `/api/organizations/${orgId}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}
