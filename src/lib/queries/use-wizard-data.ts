import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Customer, ServiceCatalog, Vehicle } from "@/lib/types";
import {
  customerKeys,
  mechanicKeys,
  priceMemoryKeys,
  serviceKeys,
  vehicleKeys,
  wizardKeys,
  workOrderKeys,
} from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface LastVisitInfo {
  services: {
    service_catalog_id: string | null;
    service_name: string;
    unit_price: number;
    quantity: number;
  }[];
  parts: {
    part_name: string;
    part_number: string | null;
    unit_price: number;
    quantity: number;
  }[];
  mechanic_id: string | null;
  notes: string | null;
}

export interface VehicleLastVisitData {
  owner: Customer | null;
  lastVisit: LastVisitInfo | null;
}

export interface MechanicOption {
  id: string;
  fullName: string | null;
  email: string;
  current_jobs?: number;
}

export interface PriceHistoryData {
  services: Record<
    string,
    { last_price: number; last_make?: string; last_model?: string }
  >;
  parts: Record<string, number>;
}

// ── Queries ────────────────────────────────────────────────────

/**
 * Fetch the service catalog for the given organization.
 */
export function useServiceCatalog(
  orgId: string | undefined,
): UseQueryResult<ServiceCatalog[], Error> {
  return useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/services`);
      if (!res.ok) throw new Error("Failed to load service catalog");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as ServiceCatalog[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch mechanics list + active work orders to compute current job count.
 */
export function useMechanicsWithJobCount(
  orgId: string | undefined,
): UseQueryResult<MechanicOption[], Error> {
  return useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const [mechRes, woRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/reports?type=mechanics`),
        fetch(`/api/organizations/${orgId}/work-orders`),
      ]);
      if (!mechRes.ok) throw new Error("Failed to load mechanics");
      const mechJson = await mechRes.json();
      const woJson = await woRes.json();

      const mechanicsList = mechJson.data ?? [];
      const activeStatuses = [
        "New",
        "Diagnosing",
        "In Progress",
        "Ready for Pickup",
      ];
      const activeWorkOrders = (woJson.data ?? []).filter(
        (wo: { status: string }) => activeStatuses.includes(wo.status),
      );

      return mechanicsList.map(
        (mechanic: { id: string; full_name: string | null }) => ({
          id: mechanic.id,
          fullName: mechanic.full_name ?? null,
          email: "",
          current_jobs: activeWorkOrders.filter(
            (wo: { mechanic_id: string | null }) =>
              wo.mechanic_id === mechanic.id,
          ).length,
        }),
      ) as MechanicOption[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Search customers by name/phone via the API.
 */
export function useCustomerSearch(
  orgId: string | undefined,
  query: string,
): UseQueryResult<Customer[], Error> {
  return useQuery({
    queryKey: customerKeys.list(orgId ?? "", query),
    queryFn: async () => {
      const url = `/api/organizations/${orgId}/customers?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search customers");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as Customer[];
    },
    enabled: !!orgId && query.length > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Search customers by vehicle plate number via direct Supabase query.
 * Kept as a browser query because there is no API route for customer-by-plate.
 */
export function useCustomersByPlate(
  orgId: string | undefined,
  plateQuery: string,
): UseQueryResult<Customer[], Error> {
  return useQuery({
    queryKey: wizardKeys.customersByPlate(orgId ?? "", plateQuery),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vehicles")
        .select("vehicle_owners!inner(customers(*))")
        .eq("organization_id", orgId)
        .ilike("plate_number", `%${plateQuery}%`)
        .is("deleted_at", null)
        .is("vehicle_owners.owned_until", null)
        .limit(5);

      if (error) throw new Error(error.message);

      const customerMap = new Map<string, Customer>();
      for (const row of data ?? []) {
        const owners = row.vehicle_owners as unknown as {
          customers?: Customer | Customer[];
        }[];
        const ownerCustomer = owners?.[0]?.customers;
        const customer = Array.isArray(ownerCustomer)
          ? ownerCustomer[0]
          : ownerCustomer;
        if (customer) customerMap.set(customer.id, customer);
      }
      return Array.from(customerMap.values());
    },
    enabled: !!orgId && plateQuery.length > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Search vehicles by customer and/or plate query.
 */
export function useVehicleSearch(
  orgId: string | undefined,
  customerId: string | undefined,
  plateQuery: string,
): UseQueryResult<Vehicle[], Error> {
  return useQuery({
    queryKey: vehicleKeys.list(
      orgId ?? "",
      `${customerId ?? ""}__${plateQuery}`,
    ),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerId) params.set("customer", customerId);
      if (plateQuery) params.set("plate", plateQuery);
      const url = `/api/organizations/${orgId}/vehicles?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search vehicles");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as Vehicle[];
    },
    enabled:
      !!orgId && (plateQuery.length >= 2 || (!!customerId && !plateQuery)),
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Fetch the last visit data for a vehicle, including owner lookup.
 * Returns both the current owner (if any) and the last visit info.
 */
export function useVehicleLastVisit(
  orgId: string | undefined,
  vehicleId: string | undefined,
): UseQueryResult<VehicleLastVisitData, Error> {
  return useQuery({
    queryKey: priceMemoryKeys.lastVisit(orgId ?? "", vehicleId ?? ""),
    queryFn: async () => {
      const supabase = createClient();

      // Look up current owner
      const { data: ownerData } = await supabase
        .from("vehicle_owners")
        .select("customers(*)")
        .eq("organization_id", orgId)
        .eq("vehicle_id", vehicleId)
        .is("owned_until", null)
        .limit(1)
        .maybeSingle();

      const owner = (ownerData?.customers as Customer | null | undefined) ?? null;

      // Get last work order
      const { data: workOrders, error: woError } = await supabase
        .from("work_orders")
        .select("id, mechanic_id, notes")
        .eq("organization_id", orgId)
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (woError) throw new Error(woError.message);
      const workOrder = workOrders?.[0];
      if (!workOrder) {
        return { owner, lastVisit: null };
      }

      // Get services and parts for the last work order
      const [servicesResult, partsResult] = await Promise.all([
        supabase
          .from("work_order_services")
          .select("service_catalog_id, service_name, unit_price, quantity")
          .eq("work_order_id", workOrder.id),
        supabase
          .from("work_order_parts")
          .select("part_name, part_number, unit_price, quantity")
          .eq("work_order_id", workOrder.id),
      ]);

      if (servicesResult.error) throw new Error(servicesResult.error.message);
      if (partsResult.error) throw new Error(partsResult.error.message);

      const lastVisit: LastVisitInfo = {
        services: (servicesResult.data ?? []).map((service) => ({
          service_catalog_id: service.service_catalog_id,
          service_name: service.service_name,
          unit_price: Number(service.unit_price),
          quantity: Number(service.quantity),
        })),
        parts: (partsResult.data ?? []).map((part) => ({
          part_name: part.part_name,
          part_number: part.part_number,
          unit_price: Number(part.unit_price),
          quantity: Number(part.quantity),
        })),
        mechanic_id: workOrder.mechanic_id,
        notes: workOrder.notes ?? null,
      };

      return { owner, lastVisit };
    },
    enabled: !!orgId && !!vehicleId,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch price history (services + parts) for the organization.
 */
export function usePriceHistory(
  orgId: string | undefined,
): UseQueryResult<PriceHistoryData, Error> {
  return useQuery({
    queryKey: wizardKeys.priceHistory(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/price-history`);
      if (!res.ok) throw new Error("Failed to load price history");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return {
        services: json.data?.services ?? {},
        parts: json.data?.parts ?? {},
      } as PriceHistoryData;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Mutations ──────────────────────────────────────────────────

/**
 * Create a new customer.
 */
export function useCreateCustomer(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      first_name: string;
      last_name?: string | null;
      phone?: string | null;
    }) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to create customer");
      }
      return json.data as Customer;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: customerKeys.all(orgId),
        });
      }
    },
  });
}

/**
 * Create a new vehicle.
 */
export function useCreateVehicle(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      plate_number: string;
      make: string;
      model: string;
      year?: number | null;
      customer_id?: string | null;
    }) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to create vehicle");
      }
      return json.data as Vehicle;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: vehicleKeys.all(orgId),
        });
      }
    },
  });
}

/**
 * Create a work order with batched services and parts.
 */
export function useCreateWorkOrder(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      customer_id: string;
      vehicle_id: string;
      mechanic_id?: string | null;
      notes?: string;
      services: {
        service_catalog_id: string | null;
        service_name: string;
        quantity: number;
        unit_price: number;
        discount_amount?: number;
        discount_percentage?: number;
      }[];
      parts: {
        part_name: string;
        part_number: string | null;
        quantity: number;
        unit_price: number;
        discount_amount?: number;
        discount_percentage?: number;
      }[];
    }) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/work-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to create work order");
      }
      return json.data as { id: string };
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId),
        });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
