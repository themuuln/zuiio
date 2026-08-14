"use client";

import { useQuery } from "@tanstack/react-query";

interface PartSearchResult {
  id: string;
  part_name: string;
  sku?: string;
  unit_price: number;
  current_stock?: number;
}

export function usePartSearch(orgId: string | null, query: string) {
  return useQuery<PartSearchResult[]>({
    queryKey: ["part-search", orgId, query.trim().toLowerCase()],
    queryFn: async () => {
      if (!orgId || query.trim().length < 2) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/inventory?q=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error("Failed to search parts");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!orgId && query.trim().length >= 2,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
