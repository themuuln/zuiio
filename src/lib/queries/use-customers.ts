import {
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import type { CreateCustomerParams, Customer } from "@/lib/types";
import { useOrgMutation } from "./mutation-factory";
import { createOrgQuery } from "./factory";
import { customerKeys } from "./keys";

interface CustomerWithVehicleCount extends Customer {
  vehicle_count?: number;
  organization_name?: string;
}

const fetchCustomers = createOrgQuery<CustomerWithVehicleCount[]>(
  "/customers",
  {
    unwrap: "paginated",
  },
);

const fetchSharedCustomers = createOrgQuery<CustomerWithVehicleCount[]>(
  "/customers",
  { unwrap: "paginated" },
);

/**
 * Fetches customers for the given organization, optionally filtered by query and branch.
 */
export function useCustomers(
  orgId: string | undefined,
  query = "",
  branchId?: string | null,
): UseQueryResult<CustomerWithVehicleCount[], Error> {
  return useQuery({
    queryKey: [...customerKeys.list(orgId ?? "", query), branchId ?? "all"],
    queryFn: () =>
      fetchCustomers(orgId!, {
        params: {
          ...(query ? { q: query } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
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

// ── Mutations ────────────────────────────────────────────────────

export function useCreateCustomer(orgId: string | undefined) {
  return useOrgMutation<Customer, CreateCustomerParams>({
    endpoint: `/api/organizations/${orgId}/customers`,
    method: "POST",
    queryKey: customerKeys.all(orgId ?? ""),
    successMessage: "Customer created",
  });
}

export function useCustomerDuplicateCheck(
  orgId: string | undefined,
  phone?: string,
  email?: string,
) {
  return useQuery({
    queryKey: [
      ...customerKeys.all(orgId ?? ""),
      "duplicate-check",
      phone,
      email,
    ],
    queryFn: async () => {
      if (!orgId) return null;
      const query = phone || email;
      if (!query || query.length < 3) return null;
      const res = await fetch(
        `/api/organizations/${orgId}/customers?q=${encodeURIComponent(query)}&pageSize=5`,
      );
      const json = await res.json();
      if (!res.ok || json.error) return null;
      const customers = (json.data?.data ?? json.data ?? []) as Customer[];
      if (!customers.length) return null;
      const phoneMatch = phone
        ? customers.find((c) => c.phone === phone)
        : null;
      const emailMatch = email
        ? customers.find((c) => c.email === email)
        : null;
      return { phoneMatch, emailMatch };
    },
    enabled:
      !!orgId &&
      !!((phone && phone.length >= 3) || (email && email.length >= 3)),
    staleTime: 10_000,
  });
}
