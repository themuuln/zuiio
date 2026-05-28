/**
 * Query factory — eliminates repeated fetch+unwrap boilerplate across hooks.
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

type UnwrapMode = "direct" | "paginated";

interface FetchOptions {
  /** Additional query parameters. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Custom error message. */
  errorMessage?: string;
}

/**
 * Create a fetcher for an org-scoped API endpoint.
 * Handles: fetch → check response → unwrap JSON → type assert.
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
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        fetchOpts?.errorMessage ?? `Failed to load ${path.split("/").pop()}`,
      );
    }

    const json = await res.json();

    if (json.error) {
      throw new Error(json.error.message);
    }

    if (unwrap === "paginated") {
      return (json.data?.data ?? json.data ?? []) as T;
    }

    return json.data as T;
  };
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
