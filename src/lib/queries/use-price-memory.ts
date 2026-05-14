import { useQuery } from "@tanstack/react-query";
import { priceMemoryKeys } from "@/lib/queries/keys";
import { createClient } from "@/lib/supabase/client";
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
  work_order_id: string;
  created_at: string;
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
}

export interface CustomerAutoFillData {
  vehicles: Vehicle[];
  lastVehicleId: string | null;
  lastVisit: LastVisitData | null;
}

// ── Hooks ──────────────────────────────────────────────────────

/**
 * Fetch last 3 service prices for a given service + vehicle make/model.
 */
export function useLastServicePrices(
  orgId: string | undefined,
  serviceCatalogId: string | undefined,
  vehicleMake?: string,
  vehicleModel?: string,
) {
  return useQuery({
    queryKey: priceMemoryKeys.servicePrices(
      orgId ?? "",
      serviceCatalogId ?? "",
      vehicleMake ?? "",
      vehicleModel ?? "",
    ),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("service_price_history")
        .select(
          "unit_price, final_price, vehicle_make, vehicle_model, created_at",
        )
        .eq("organization_id", orgId)
        .eq("service_catalog_id", serviceCatalogId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);
      if (vehicleModel) query = query.eq("vehicle_model", vehicleModel);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        unit_price: Number(row.unit_price ?? 0),
        final_price: Number(row.final_price ?? 0),
        vehicle_make: row.vehicle_make,
        vehicle_model: row.vehicle_model,
        created_at: row.created_at,
      })) as ServicePriceEntry[];
    },
    enabled: !!orgId && !!serviceCatalogId,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Fetch last 3 part prices for a given part name + vehicle make.
 */
export function useLastPartPrices(
  orgId: string | undefined,
  partName: string | undefined,
  vehicleMake?: string,
) {
  return useQuery({
    queryKey: priceMemoryKeys.partPrices(
      orgId ?? "",
      partName ?? "",
      vehicleMake ?? "",
    ),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("part_price_history")
        .select(
          "unit_price, final_price, part_number, vehicle_make, vehicle_model, created_at",
        )
        .eq("organization_id", orgId)
        .ilike("part_name", partName ?? "")
        .order("created_at", { ascending: false })
        .limit(3);

      if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        unit_price: Number(row.unit_price ?? 0),
        final_price: Number(row.final_price ?? 0),
        part_number: row.part_number,
        vehicle_make: row.vehicle_make,
        vehicle_model: row.vehicle_model,
        created_at: row.created_at,
      })) as PartPriceEntry[];
    },
    enabled: !!orgId && !!partName && partName.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
}

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
      const supabase = createClient();
      const { data: workOrders, error: workOrderError } = await supabase
        .from("work_orders")
        .select("id, mechanic_id, description, created_at")
        .eq("organization_id", orgId)
        .eq("vehicle_id", vehicleId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (workOrderError) throw new Error(workOrderError.message);
      const lastWorkOrder = workOrders?.[0];
      if (!lastWorkOrder) return null;

      const [servicesResult, partsResult] = await Promise.all([
        supabase
          .from("work_order_services")
          .select("service_catalog_id, service_name, unit_price, quantity")
          .eq("work_order_id", lastWorkOrder.id),
        supabase
          .from("work_order_parts")
          .select("part_name, part_number, unit_price, quantity")
          .eq("work_order_id", lastWorkOrder.id),
      ]);

      if (servicesResult.error) throw new Error(servicesResult.error.message);
      if (partsResult.error) throw new Error(partsResult.error.message);

      return {
        work_order_id: lastWorkOrder.id,
        created_at: lastWorkOrder.created_at,
        mechanic_id: lastWorkOrder.mechanic_id,
        description: lastWorkOrder.description,
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
      const supabase = createClient();
      const { data: ownedVehicles, error: ownerError } = await supabase
        .from("vehicle_owners")
        .select("vehicle_id")
        .eq("organization_id", orgId)
        .eq("customer_id", customerId)
        .is("owned_until", null);

      if (ownerError) throw new Error(ownerError.message);
      const vehicleIds = (ownedVehicles ?? []).map((owner) => owner.vehicle_id);
      if (vehicleIds.length === 0) {
        return {
          vehicles: [],
          lastVehicleId: null,
          lastVisit: null,
        } as CustomerAutoFillData;
      }

      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("organization_id", orgId)
        .in("id", vehicleIds)
        .is("deleted_at", null)
        .order("last_visit_at", { ascending: false, nullsFirst: false });

      if (vehiclesError) throw new Error(vehiclesError.message);
      const lastVehicleId = vehicleId ?? vehicles?.[0]?.id ?? null;
      return {
        vehicles: (vehicles ?? []) as Vehicle[],
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
      const supabase = createClient();
      const { data, error } = await supabase
        .from("service_price_history")
        .select("service_catalog_id, unit_price, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      const map: Record<string, { unit_price: number; created_at: string }> =
        {};
      for (const row of data ?? []) {
        if (!row.service_catalog_id || map[row.service_catalog_id]) continue;
        map[row.service_catalog_id] = {
          unit_price: Number(row.unit_price ?? 0),
          created_at: row.created_at,
        };
      }
      return map;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}
