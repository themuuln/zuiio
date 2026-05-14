"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Vehicle } from "@/lib/types";

interface LastVisitInfo {
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

interface UseVehicleSelectionParams {
  orgId: string | null;
  selectedCustomer: Customer | null;
  setSelectedVehicle: (v: Vehicle | null) => void;
  setSelectedCustomer: (c: Customer | null) => void;
  setVehicleSearch: (v: string) => void;
  setShowQuickVehicle: (v: boolean) => void;
  setLastVisitData: (d: LastVisitInfo | null) => void;
  setShowLastVisitSuggestions: (v: boolean) => void;
}

export function useVehicleSelection({
  orgId,
  selectedCustomer,
  setSelectedVehicle,
  setSelectedCustomer,
  setVehicleSearch,
  setShowQuickVehicle,
  setLastVisitData,
  setShowLastVisitSuggestions,
}: UseVehicleSelectionParams) {
  const handleSelectVehicle = useCallback(
    async (vehicle: Vehicle) => {
      setSelectedVehicle(vehicle);
      setVehicleSearch("");
      setShowQuickVehicle(false);
      setLastVisitData(null);
      setShowLastVisitSuggestions(false);

      if (!orgId || !vehicle.id) return;

      const supabase = createClient();

      if (!selectedCustomer) {
        const { data: ownerData } = await supabase
          .from("vehicle_owners")
          .select("customers(*)")
          .eq("organization_id", orgId)
          .eq("vehicle_id", vehicle.id)
          .is("owned_until", null)
          .limit(1)
          .maybeSingle();
        const customer = ownerData?.customers as Customer | null | undefined;
        if (customer) setSelectedCustomer(customer);
      }

      try {
        const { data: workOrders } = await supabase
          .from("work_orders")
          .select("id, mechanic_id")
          .eq("organization_id", orgId)
          .eq("vehicle_id", vehicle.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);

        const workOrder = workOrders?.[0];
        if (!workOrder) return;

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

        const data: LastVisitInfo = {
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
          notes: null,
        };
        setLastVisitData(data);
        if (data.services.length > 0 || data.parts.length > 0) {
          setShowLastVisitSuggestions(true);
        }
      } finally {
        // intentionally no-op for try/finally pattern
      }
    },
    [
      orgId,
      selectedCustomer,
      setSelectedVehicle,
      setSelectedCustomer,
      setVehicleSearch,
      setShowQuickVehicle,
      setLastVisitData,
      setShowLastVisitSuggestions,
    ],
  );

  return { handleSelectVehicle };
}
