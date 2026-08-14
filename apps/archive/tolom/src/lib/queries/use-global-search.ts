"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GlobalSearchResult } from "@/lib/services/global-search-service";
import { createOrgQuery } from "./factory";

const fetchGlobalSearch = createOrgQuery<GlobalSearchResult>("/global-search");

const MIN_QUERY_LENGTH = 2;

/**
 * Global search across customers, vehicles, work orders and parts.
 * Enabled only when the query is at least 2 characters — powers the ⌘K dialog.
 */
export function useGlobalSearch(
  orgId: string | undefined,
  query: string,
  options?: { limit?: number },
) {
  const term = query.trim();
  return useQuery({
    queryKey: [
      "global-search",
      orgId ?? "",
      term.toLowerCase(),
      options?.limit ?? 5,
    ],
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchGlobalSearch(orgId, {
        params: {
          q: term,
          ...(options?.limit ? { limit: String(options.limit) } : {}),
        },
      });
    },
    enabled: !!orgId && term.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
