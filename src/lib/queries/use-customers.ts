import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { Customer } from "@/lib/database.types";
import { customerKeys } from "./keys";

interface CustomerWithVehicleCount extends Customer {
  vehicle_count?: number;
}

/**
 * Fetches customers for the given organization, optionally filtered by query.
 * `enabled: !!orgId` prevents fetching before org is available.
 */
export function useCustomers(
  orgId: string | undefined,
  query = "",
): UseQueryResult<CustomerWithVehicleCount[], Error> {
  return useQuery({
    queryKey: customerKeys.list(orgId ?? "", query),
    queryFn: async () => {
      const url = `/api/organizations/${orgId}/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load customers");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      // API returns { data: PaginatedResponse<Customer> }, unwrap .data.data
      return (json.data?.data ?? json.data ?? []) as CustomerWithVehicleCount[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
