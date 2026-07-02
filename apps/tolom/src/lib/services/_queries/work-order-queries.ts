import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/errors";
import type {
  Customer,
  DiagnosisLabel,
  Vehicle,
  WorkOrderDetail,
  WorkOrderHelper,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderServiceHistoryEntry,
  WorkOrderStatusHistory,
} from "@/lib/types";

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
    { data: helpersData },
    { data: priorServiceVisits },
    { data: existingInvoice },
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
    supabase
      .from("work_order_helpers")
      .select("id, work_order_id, mechanic_id, created_at, created_by")
      .eq("work_order_id", id),
    wo.vehicle_id
      ? supabase
          .from("work_orders")
          .select(
            "id, status, complaint, diagnosis, notes, total, created_at, mechanic_id",
          )
          .eq("organization_id", wo.organization_id)
          .eq("vehicle_id", wo.vehicle_id)
          .neq("id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] },
    supabase
      .from("invoices")
      .select("public_token")
      .eq("work_order_id", id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  // Fetch helper mechanic profiles separately (work_order_helpers.mechanic_id
  // references auth.users, not profiles, so PostgREST can't auto-join)
  const helperMechanicIds = [
    ...new Set((helpersData ?? []).map((h) => h.mechanic_id)),
  ] as string[];
  const { data: helperProfiles } =
    helperMechanicIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", helperMechanicIds)
      : { data: [] };
  const helperProfileMap = new Map(
    (helperProfiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const priorVisitIds = (priorServiceVisits ?? []).map((visit) => visit.id);
  const priorVisitMechanicIds = [
    ...new Set(
      (priorServiceVisits ?? []).flatMap((visit) =>
        visit.mechanic_id ? [visit.mechanic_id] : [],
      ),
    ),
  ] as string[];

  const [
    { data: priorVisitProfiles },
    { data: priorVisitServices },
    { data: priorVisitHelpers },
    { data: priorVisitParts },
  ] =
    priorVisitIds.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", priorVisitMechanicIds),
          supabase
            .from("work_order_services")
            .select("work_order_id, service_name, final_price")
            .in("work_order_id", priorVisitIds),
          supabase
            .from("work_order_helpers")
            .select("work_order_id, mechanic_id")
            .in("work_order_id", priorVisitIds),
          supabase
            .from("work_order_parts")
            .select("work_order_id, part_name, quantity, final_price")
            .in("work_order_id", priorVisitIds),
        ]);

  // Build helper profiles for prior visits
  const priorVisitHelperIds = [
    ...new Set((priorVisitHelpers ?? []).map((h) => h.mechanic_id)),
  ] as string[];
  const { data: priorVisitHelperProfiles } =
    priorVisitHelperIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", priorVisitHelperIds)
      : { data: [] };
  const priorVisitHelperProfileMap = new Map(
    (priorVisitHelperProfiles ?? []).map((p) => [p.id, p.full_name]),
  );
  const priorVisitHelpersMap = new Map<
    string,
    { id: string; full_name: string | null }[]
  >();
  for (const h of priorVisitHelpers ?? []) {
    const existing = priorVisitHelpersMap.get(h.work_order_id) ?? [];
    existing.push({
      id: h.mechanic_id,
      full_name: priorVisitHelperProfileMap.get(h.mechanic_id) ?? null,
    });
    priorVisitHelpersMap.set(h.work_order_id, existing);
  }

  const priorVisitMechanicMap = new Map(
    (priorVisitProfiles ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  );
  const priorVisitServicesMap = new Map<
    string,
    WorkOrderServiceHistoryEntry["services"]
  >();
  for (const service of priorVisitServices ?? []) {
    const existing = priorVisitServicesMap.get(service.work_order_id) ?? [];
    existing.push({
      name: service.service_name,
      price: Number(service.final_price ?? 0),
    });
    priorVisitServicesMap.set(service.work_order_id, existing);
  }

  const priorVisitPartsMap = new Map<
    string,
    WorkOrderServiceHistoryEntry["parts"]
  >();
  for (const part of priorVisitParts ?? []) {
    const existing = priorVisitPartsMap.get(part.work_order_id) ?? [];
    existing.push({
      name: part.part_name,
      quantity: part.quantity,
      price: Number(part.final_price ?? 0),
    });
    priorVisitPartsMap.set(part.work_order_id, existing);
  }

  return {
    ...wo,
    customer: customerData as Customer | null,
    vehicle: (vehicleData as Vehicle | null) ?? null,
    mechanic: mechanicData as {
      id: string;
      full_name: string | null;
    } | null,
    helpers: ((helpersData ?? []) as WorkOrderHelper[]).map((h) => ({
      ...h,
      full_name: helperProfileMap.get(h.mechanic_id) ?? null,
    })),
    services: (services ?? []) as WorkOrderService[],
    parts: (parts ?? []) as WorkOrderPart[],
    status_history: (statusHistory ?? []) as WorkOrderStatusHistory[],
    service_history: (priorServiceVisits ?? []).map((visit) => ({
      work_order_id: visit.id,
      status: visit.status,
      created_at: visit.created_at,
      complaint: visit.complaint,
      diagnosis: visit.diagnosis,
      notes: visit.notes,
      total: Number(visit.total ?? 0),
      mechanic_name: visit.mechanic_id
        ? (priorVisitMechanicMap.get(visit.mechanic_id) ?? null)
        : null,
      services: priorVisitServicesMap.get(visit.id) ?? [],
      parts: priorVisitPartsMap.get(visit.id) ?? [],
      helpers: priorVisitHelpersMap.get(visit.id) ?? [],
    })),
    diagnosis_label: labelData as DiagnosisLabel | null,
    invoice_public_token:
      (existingInvoice as { public_token: string | null } | null)
        ?.public_token ?? null,
  };
}
