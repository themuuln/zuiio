"use client";

import { useQuery } from "@tanstack/react-query";
import { searchVehiclesWithCustomers } from "@/lib/services/bay-view-actions";

export interface VehicleSearchResult {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  _fromQueue?: true;
  _workOrderId?: string;
}

export function useVehicleSearch(
  search: string,
  options?: { enabled?: boolean },
) {
  return useQuery<VehicleSearchResult[]>({
    queryKey: ["vehicle-search", search.trim().toLowerCase()],
    queryFn: () => searchVehiclesWithCustomers(search),
    enabled: !!search.trim() && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
