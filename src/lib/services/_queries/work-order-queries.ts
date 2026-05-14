import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type {
  Customer,
  WorkOrderDetail,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderStatusHistory,
} from "@/lib/database.types";
import { NotFoundError } from "@/lib/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches a single work order with all its related data:
 * services, parts, status_history, customer, vehicle, mechanic.
 *
 * Accepts a SupabaseClient so callers can reuse their existing client
 * instead of creating a new one. This is the shared query module
 * that avoids circular dependencies between service modules.
 */
export async function getWorkOrderDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<WorkOrderDetail> {
  return withCache(
    ["getWorkOrderDetail", id],
    async () => {
      // Fetch WO
      const { data: wo, error: woError } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (woError || !wo) throw new NotFoundError("Work order not found");

      // Fetch related data in parallel
      const [
        { data: services },
        { data: parts },
        { data: statusHistory },
        { data: customerData },
        { data: vehicleData },
        { data: mechanicData },
      ] = await Promise.all([
        supabase
          .from("work_order_services")
          .select("*")
          .eq("work_order_id", id)
          .order("created_at"),
        supabase
          .from("work_order_parts")
          .select("*")
          .eq("work_order_id", id)
          .order("created_at"),
        supabase
          .from("work_order_status_history")
          .select("*")
          .eq("work_order_id", id)
          .order("created_at", { ascending: false }),
        wo.customer_id
          ? supabase.from("customers").select("*").eq("id", wo.customer_id).single()
          : { data: null },
        wo.vehicle_id
          ? supabase.from("vehicles").select("*").eq("id", wo.vehicle_id).single()
          : { data: null },
        wo.mechanic_id
          ? supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", wo.mechanic_id)
              .single()
          : { data: null },
      ]);

      return {
        ...wo,
        customer: customerData as Customer | null,
        vehicle: (vehicleData as Customer | null) ?? null,
        mechanic: mechanicData as { id: string; full_name: string | null } | null,
        services: (services ?? []) as WorkOrderService[],
        parts: (parts ?? []) as WorkOrderPart[],
        status_history: (statusHistory ?? []) as WorkOrderStatusHistory[],
      };
    },
    {
      tags: [cacheTags.workOrderDetail(id)],
      revalidate: cacheDurations.workOrderDetail,
    },
  );
}
