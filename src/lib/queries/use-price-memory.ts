import { useQuery } from "@tanstack/react-query";
import { priceMemoryKeys } from "@/lib/queries/keys";
import type { Vehicle } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────

export interface ServicePriceEntry {
  unit_price: number;
  final_price: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
}

export interface PartPriceEntry {
  unit_price: number;
  final_price: number;
  part_number: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
}

export interface LastVisitData {
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
  description: string | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

export interface CustomerAutoFillData {
  vehicles: Vehicle[];
  lastVehicleId: string | null;
  lastVisit: LastVisitData | null;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function fetchApiData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to fetch price memory data");
  }

  return payload.data;
}

// ── Hooks ──────────────────────────────────────────────────────

/**
 * Fetch the last visit data for a vehicle — services, parts, mechanic.
 * Used to pre-fill "From last visit" suggestions.
 */
export function useLastVisitData(
  orgId: string | undefined,
  vehicleId: string | undefined,
) {
  return useQuery({
    queryKey: priceMemoryKeys.lastVisit(orgId ?? "", vehicleId ?? ""),
    queryFn: async () => {
      const params = new URLSearchParams({ vehicle_id: vehicleId ?? "" });
      const data = await fetchApiData<
        (Omit<LastVisitData, "description"> & { notes: string | null }) | null
      >(
        `/api/organizations/${orgId}/price-history/last-visit?${params.toString()}`,
      );

      if (!data) return null;

      return {
        mechanic_id: data.mechanic_id,
        description: data.notes,
        owner: data.owner,
        services: data.services.map((service) => ({
          service_catalog_id: service.service_catalog_id,
          service_name: service.service_name,
          unit_price: Number(service.unit_price),
          quantity: Number(service.quantity),
        })),
        parts: data.parts.map((part) => ({
          part_name: part.part_name,
          part_number: part.part_number,
          unit_price: Number(part.unit_price),
          quantity: Number(part.quantity),
        })),
      } as LastVisitData;
    },
    enabled: !!orgId && !!vehicleId,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Fetch customer auto-fill data: vehicles + last visit info.
 */
export function useCustomerAutoFill(
  orgId: string | undefined,
  customerId: string | undefined,
  vehicleId?: string,
) {
  return useQuery({
    queryKey: priceMemoryKeys.customerAutoFill(
      orgId ?? "",
      customerId ?? "",
      vehicleId,
    ),
    queryFn: async () => {
      const params = new URLSearchParams({ customer_id: customerId ?? "" });
      const data = await fetchApiData<Omit<CustomerAutoFillData, "lastVisit">>(
        `/api/organizations/${orgId}/price-history/customer-autofill?${params.toString()}`,
      );
      const lastVehicleId = vehicleId ?? data.lastVehicleId ?? null;

      return {
        vehicles: data.vehicles,
        lastVehicleId,
        lastVisit: null,
      } as CustomerAutoFillData;
    },
    enabled: !!orgId && !!customerId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useServiceLastUsedPrices(orgId: string | undefined) {
  return useQuery({
    queryKey: priceMemoryKeys.serviceLastUsed(orgId ?? ""),
    queryFn: async () => {
      const data = await fetchApiData<{
        services: Record<
          string,
          { unit_price?: number; last_price?: number; created_at?: string }
        >;
      }>(`/api/organizations/${orgId}/price-history`);
      const map: Record<string, { unit_price: number; created_at: string }> =
        {};
      for (const [serviceCatalogId, row] of Object.entries(data.services)) {
        map[serviceCatalogId] = {
          unit_price: Number(row.unit_price ?? row.last_price ?? 0),
          created_at: row.created_at ?? "",
        };
      }
      return map;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}
