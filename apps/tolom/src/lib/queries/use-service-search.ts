"use client";

import { useQuery } from "@tanstack/react-query";

interface ServiceSearchResult {
  id: string;
  name: string;
  default_price: number;
  estimated_hours?: number;
  category?: string;
}

export function useServiceSearch(orgId: string | null, query: string) {
  return useQuery<ServiceSearchResult[]>({
    queryKey: ["service-search", orgId, query.trim().toLowerCase()],
    queryFn: async () => {
      if (!orgId || query.trim().length < 2) return [];
      const res = await fetch(
        `/api/organizations/${orgId}/services?q=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error("Failed to search services");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!orgId && query.trim().length >= 2,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
