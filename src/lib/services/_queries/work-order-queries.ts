import type { WorkOrderDetail } from "@/lib/types";
import type {
  Customer,
  DiagnosisLabel,
  Vehicle,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderStatusHistory,
} from "@/lib/types";
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
  // Fetch WO
  const { data: wo, error: woError } = await supabase
    .from("work_orders")
    .select(
      "id, organization_id, branch_id, customer_id, vehicle_id, bay_number, status, description, notes, mechanic_id, complaint, diagnosis, mechanic_notes, subtotal, discount_total, total, discount_amount, discount_percentage, odometer_at_service, queue_order, diagnosis_label_id, started_at, completed_at, created_at, updated_at, created_by, updated_by, deleted_at, loss_reason",
    )
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
    { data: labelData },
  ] = await Promise.all([
    supabase
      .from("work_order_services")
      .select(
        "id, work_order_id, service_catalog_id, service_name, description, unit_price, discount_amount, discount_percentage, quantity, final_price, notes, mechanic_id, unit_cost, created_at",
      )
      .eq("work_order_id", id)
      .order("created_at"),
    supabase
      .from("work_order_parts")
      .select(
        "id, work_order_id, part_name, part_number, quantity, unit_price, final_price, notes, discount_amount, discount_percentage, unit_cost, created_at",
      )
      .eq("work_order_id", id)
      .order("created_at"),
    supabase
      .from("work_order_status_history")
      .select(
        "id, work_order_id, organization_id, previous_status, status, notes, created_by, created_at",
      )
      .eq("work_order_id", id)
      .order("created_at", { ascending: false }),
    wo.customer_id
      ? supabase
          .from("customers")
          .select(
            "id, organization_id, first_name, last_name, phone, email, type, company_name, contact_person, address, notes",
          )
          .eq("id", wo.customer_id)
          .single()
      : { data: null },
    wo.vehicle_id
      ? supabase
          .from("vehicles")
          .select(
            "id, organization_id, plate_number, make, model, year, vin, color, odometer",
          )
          .eq("id", wo.vehicle_id)
          .single()
      : { data: null },
    wo.mechanic_id
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", wo.mechanic_id)
          .single()
      : { data: null },
    wo.diagnosis_label_id
      ? supabase
          .from("diagnosis_labels")
          .select("id, organization_id, name, name_mn, color, sort_order")
          .eq("id", wo.diagnosis_label_id)
          .single()
      : { data: null },
  ]);

  return {
    ...wo,
    customer: customerData as Customer | null,
    vehicle: (vehicleData as Vehicle | null) ?? null,
    mechanic: mechanicData as {
      id: string;
      full_name: string | null;
    } | null,
    services: (services ?? []) as WorkOrderService[],
    parts: (parts ?? []) as WorkOrderPart[],
    status_history: (statusHistory ?? []) as WorkOrderStatusHistory[],
    diagnosis_label: labelData as DiagnosisLabel | null,
  };
}
