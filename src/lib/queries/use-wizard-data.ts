import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Customer, ServiceCatalog, Vehicle } from "@/lib/types";
import { createOrgQuery } from "./factory";
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

// ── Vehicle-Contextualized Price Types ─────────────────────────

export interface VehicleServicePriceEntry {
  unit_price: number;
  final_price: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
}

export interface VehiclePartPriceEntry {
  unit_price: number;
  final_price: number;
  part_number: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
}

/**
 * Fetch the most recent service price for a specific vehicle make/model.
 * Used inside callbacks where hooks can't be called.
 */
export async function fetchVehicleServicePrice(
  orgId: string,
  serviceCatalogId: string,
  vehicleMake: string,
  vehicleModel?: string,
): Promise<number | null> {
  try {
    const params = new URLSearchParams();
    params.set("service_catalog_id", serviceCatalogId);
    params.set("vehicle_make", vehicleMake);
    if (vehicleModel) params.set("vehicle_model", vehicleModel);
    const res = await fetch(
      `/api/organizations/${orgId}/price-history/service?${params}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data = (json.data ?? []) as VehicleServicePriceEntry[];
    if (data.length === 0) return null;
    return data[0].unit_price ?? data[0].final_price ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the most recent part price for a specific vehicle make.
 * Used inside callbacks where hooks can't be called.
 */
export async function fetchVehiclePartPrice(
  orgId: string,
  partName: string,
  vehicleMake: string,
  vehicleModel?: string,
): Promise<number | null> {
  try {
    const params = new URLSearchParams();
    params.set("part_name", partName);
    params.set("vehicle_make", vehicleMake);
    if (vehicleModel) params.set("vehicle_model", vehicleModel);
    const res = await fetch(
      `/api/organizations/${orgId}/price-history/part?${params}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data = (json.data ?? []) as VehiclePartPriceEntry[];
    if (data.length === 0) return null;
    return data[0].unit_price ?? data[0].final_price ?? null;
  } catch {
    return null;
  }
}

// ── Fetchers ──────────────────────────────────────────────────

const fetchServiceCatalog = createOrgQuery<ServiceCatalog[]>("/services");

const fetchMechanicsReport =
  createOrgQuery<{ id: string; full_name: string | null }[]>("/reports");

const fetchWorkOrders =
  createOrgQuery<{ status: string; mechanic_id: string | null }[]>(
    "/work-orders",
  );

const fetchCustomers = createOrgQuery<Customer[]>("/customers", {
  unwrap: "paginated",
});

const fetchCustomersByPlate = createOrgQuery<Customer[]>("/customers/by-plate");

const fetchVehicles = createOrgQuery<Vehicle[]>("/vehicles");

const fetchVehicleLastVisit = createOrgQuery<
  (LastVisitInfo & { owner: Customer | null }) | null
>("/price-history/last-visit");

const fetchPriceHistory = createOrgQuery<PriceHistoryData>("/price-history");

const fetchVehicleServicePrices = createOrgQuery<VehicleServicePriceEntry[]>(
  "/price-history/service",
);

const fetchVehiclePartPrices = createOrgQuery<VehiclePartPriceEntry[]>(
  "/price-history/part",
);

// ── Queries ────────────────────────────────────────────────────

/**
 * Fetch the service catalog for the given organization.
 */
export function useServiceCatalog(
  orgId: string | undefined,
): UseQueryResult<ServiceCatalog[], Error> {
  return useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: () => fetchServiceCatalog(orgId!).then((d) => d ?? []),
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
      const [mechanicsList, workOrders] = await Promise.all([
        fetchMechanicsReport(orgId!, {
          params: { type: "mechanics" },
          errorMessage: "Failed to load mechanics",
        }),
        fetchWorkOrders(orgId!),
      ]);

      const activeStatuses = [
        "New",
        "Diagnosing",
        "In Progress",
        "Ready for Pickup",
      ];
      const activeWorkOrders = workOrders.filter((wo) =>
        activeStatuses.includes(wo.status),
      );

      return mechanicsList.map((mechanic) => ({
        id: mechanic.id,
        fullName: mechanic.full_name ?? null,
        email: "",
        current_jobs: activeWorkOrders.filter(
          (wo) => wo.mechanic_id === mechanic.id,
        ).length,
      })) as MechanicOption[];
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
    queryFn: () => fetchCustomers(orgId!, { params: { q: query } }),
    enabled: !!orgId && query.length > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Search customers by vehicle plate number via the API.
 */
export function useCustomersByPlate(
  orgId: string | undefined,
  plateQuery: string,
): UseQueryResult<Customer[], Error> {
  return useQuery({
    queryKey: wizardKeys.customersByPlate(orgId ?? "", plateQuery),
    queryFn: () =>
      fetchCustomersByPlate(orgId!, {
        params: { plate: plateQuery },
        errorMessage: "Failed to search customers by plate",
      }),
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
    queryFn: () => {
      // Normalize plate: strip dashes/spaces, uppercase for consistent matching
      const normalPlate = plateQuery.replace(/[\s-]/g, "").toUpperCase();
      return fetchVehicles(orgId!, {
        params: { customer: customerId, plate: normalPlate || undefined },
      });
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
      const data = await fetchVehicleLastVisit(orgId!, {
        params: { vehicle_id: vehicleId! },
        errorMessage: "Failed to load vehicle last visit",
      });

      if (!data) return { owner: null, lastVisit: null };

      const lastVisit: LastVisitInfo = {
        services: (data.services ?? []).map((service) => ({
          service_catalog_id: service.service_catalog_id,
          service_name: service.service_name,
          unit_price: Number(service.unit_price),
          quantity: Number(service.quantity),
        })),
        parts: (data.parts ?? []).map((part) => ({
          part_name: part.part_name,
          part_number: part.part_number,
          unit_price: Number(part.unit_price),
          quantity: Number(part.quantity),
        })),
        mechanic_id: data.mechanic_id,
        notes: data.notes,
      };

      return { owner: data.owner, lastVisit };
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
    queryFn: () =>
      fetchPriceHistory(orgId!).then(
        (d) =>
          ({
            services: d?.services ?? {},
            parts: d?.parts ?? {},
          }) as PriceHistoryData,
      ),
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch last 3 service prices for a specific vehicle make/model.
 * Standalone hook for use outside the wizard context.
 */
export function useVehicleServicePrices(
  orgId: string | undefined,
  serviceCatalogId: string | undefined,
  vehicleMake: string | undefined,
  vehicleModel: string | undefined,
): UseQueryResult<VehicleServicePriceEntry[], Error> {
  return useQuery({
    queryKey: priceMemoryKeys.servicePrices(
      orgId ?? "",
      serviceCatalogId ?? "",
      vehicleMake,
      vehicleModel,
    ),
    queryFn: () =>
      fetchVehicleServicePrices(orgId!, {
        params: {
          service_catalog_id: serviceCatalogId,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
        },
        errorMessage: "Failed to load vehicle service prices",
      }).then((d) => d ?? []),
    enabled: !!orgId && !!serviceCatalogId && !!vehicleMake,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch last 3 part prices for a specific vehicle make.
 * Standalone hook for use outside the wizard context.
 */
export function useVehiclePartPrices(
  orgId: string | undefined,
  partName: string | undefined,
  vehicleMake: string | undefined,
  vehicleModel?: string,
): UseQueryResult<VehiclePartPriceEntry[], Error> {
  return useQuery({
    queryKey: priceMemoryKeys.partPrices(
      orgId ?? "",
      partName ?? "",
      vehicleMake,
    ),
    queryFn: () =>
      fetchVehiclePartPrices(orgId!, {
        params: {
          part_name: partName,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
        },
        errorMessage: "Failed to load vehicle part prices",
      }).then((d) => d ?? []),
    enabled: !!orgId && !!partName && !!vehicleMake,
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
        const err = new Error(
          json.error?.message ?? "Failed to create customer",
        );
        if (json.error?.code) {
          (err as { code?: string }).code = json.error.code;
          (err as { details?: unknown }).details = json.error.details;
        }
        throw err;
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
      complaint?: string;
      diagnosis_label_id?: string | null;
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
  });
}
