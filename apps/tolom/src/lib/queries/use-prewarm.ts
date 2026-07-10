"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createOrgQuery } from "./factory";
import {
  branchKeys,
  customerKeys,
  inventoryKeys,
  serviceKeys,
  serviceReminderKeys,
  vehicleKeys,
} from "./keys";

/**
 * Module-level fetchers — created once, reused across renders.
 * These auto-cache to IndexedDB via createOrgQuery's built-in sync,
 * so prewarming doubles as offline cache seeding with zero overhead.
 */

const fetchBranches =
  createOrgQuery<{ id: string; name: string }[]>("/branches");

const fetchServiceCatalog =
  createOrgQuery<{ id: string; name: string }[]>("/services");

const fetchCustomers = createOrgQuery<{ id: string; full_name: string }[]>(
  "/customers",
  { unwrap: "paginated" },
);

const fetchVehicles = createOrgQuery<{ id: string; plate: string }[]>(
  "/vehicles",
  { unwrap: "paginated" },
);

const fetchPartsCatalog = createOrgQuery<{ id: string; name: string }[]>(
  "/inventory/parts",
  { unwrap: "paginated" },
);

const fetchServiceReminders =
  createOrgQuery<{ id: string; description: string }[]>("/service-reminders");

/**
 * Prewarm React Query cache (and IndexedDB) for commonly-used endpoints.
 *
 * ## How it works
 *
 * Runs once per session, silently in background after the initial page renders.
 * Uses `queryClient.prefetchQuery()` so React Query deduplicates automatically:
 * if the current page already fetched a query, the prewarm is a no-op.
 *
 * ## Why this replaces the old preload engine
 *
 * The old `preload-engine.ts` independently fetched 19 raw API endpoints into IndexedDB.
 * But `createOrgQuery` (used by every React Query hook) already syncs responses to IDB
 * on success. So the preload engine was doing **17 duplicate network calls** — the same
 * data fetched twice: once by React Query for the UI, once by the engine for offline.
 *
 * This hook takes a **prewarm** approach:
 * - Only prefetches queries for pages the user is likely to visit next
 * - React Query deduplication means zero wasted network bytes
 * - `createOrgQuery` syncs to IDB as a side effect, so offline cache is always current
 *
 * ## Performance benefit
 *
 * | Metric | Old preload engine | Prewarm |
 * |--------|-------------------|---------|
 * | Endpoints fetched | 19 (raw API) | 6 (React Query) |
 * | Duplicate network calls | 17 | 0 (deduplicated) |
 * | IDB sync | Separate syncApiResponse | Built into createOrgQuery |
 * | Concurrency | 5→3→2→1 waterfall | All at once |
 * | Blocks UI | Was blocking (now removed) | Never |
 */
export function usePrewarm(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const done = useRef(false);

  useEffect(() => {
    if (!orgId || done.current) return;
    done.current = true;

    // Fire all prefetches eagerly — React Query deduplicates internally.
    // If any of these are already in-flight (e.g. sidebar fetched branches),
    // prefetchQuery is a no-op for that key.
    const tasks: Promise<unknown>[] = [
      // Sidebar / navigation essentials
      queryClient.prefetchQuery({
        queryKey: branchKeys.list(orgId),
        queryFn: () => fetchBranches(orgId),
        staleTime: 5 * 60 * 1000,
      }),

      // Service catalog — needed when creating work orders
      queryClient.prefetchQuery({
        queryKey: serviceKeys.list(orgId),
        queryFn: () => fetchServiceCatalog(orgId),
        staleTime: 5 * 60 * 1000,
      }),

      // Customers — most visited page after bay view
      queryClient.prefetchQuery({
        queryKey: customerKeys.list(orgId, ""),
        queryFn: () => fetchCustomers(orgId, { params: { pageSize: "1000" } }),
        staleTime: 5 * 60 * 1000,
      }),

      // Vehicles — second most visited
      queryClient.prefetchQuery({
        queryKey: vehicleKeys.list(orgId, "", null),
        queryFn: () => fetchVehicles(orgId, { params: { pageSize: "1000" } }),
        staleTime: 5 * 60 * 1000,
      }),

      // Inventory parts — commonly referenced when adding parts to WOs
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.parts(orgId),
        queryFn: () =>
          fetchPartsCatalog(orgId, { params: { pageSize: "1000" } }),
        staleTime: 5 * 60 * 1000,
      }),

      // Service reminders — shown in sidebar count
      queryClient.prefetchQuery({
        queryKey: serviceReminderKeys.list(orgId),
        queryFn: () => fetchServiceReminders(orgId),
        staleTime: 5 * 60 * 1000,
      }),
    ];

    // Fire and forget — never block rendering
    Promise.allSettled(tasks);
  }, [orgId, queryClient]);
}
