import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { Customer } from "@/lib/types";
import { customerKeys } from "./keys";
import { createOrgQuery } from "./factory";

interface CustomerWithVehicleCount extends Customer {
  vehicle_count?: number;
  organization_name?: string;
}

const fetchCustomers = createOrgQuery<CustomerWithVehicleCount[]>("/customers", {
  unwrap: "paginated",
});

const fetchSharedCustomers = createOrgQuery<CustomerWithVehicleCount[]>(
  "/customers",
  { unwrap: "paginated" },
);

/**
 * Fetches customers for the given organization, optionally filtered by query.
 */
export function useCustomers(
  orgId: string | undefined,
  query = "",
): UseQueryResult<CustomerWithVehicleCount[], Error> {
  return useQuery({
    queryKey: customerKeys.list(orgId ?? "", query),
    queryFn: () =>
      fetchCustomers(orgId!, {
        params: query ? { q: query } : undefined,
      }),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

/**
 * Fetches customers from other organizations that have sharing enabled.
 */
export function useSharedCustomers(
  orgId: string | undefined,
  query = "",
): UseQueryResult<CustomerWithVehicleCount[], Error> {
  return useQuery({
    queryKey: [...customerKeys.list(orgId ?? "", query), "shared"],
    queryFn: () =>
      fetchSharedCustomers(orgId!, {
        params: { shared: "true", ...(query ? { q: query } : {}) },
      }),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
