"use server";

import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import type {
  ServiceCompletionDatumInsert,
  ServiceRecommendationInsert,
} from "@/lib/database-extras.types";
import { AppError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// ── Helper: resolve org from session ────────────────────────────

async function getOrgId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();

  if (!membership?.organization_id)
    throw new ValidationError("Organization not found");
  return membership.organization_id;
}

// ── Types ────────────────────────────────────────────────

export interface RecommendationInput {
  workOrderServiceId: string;
  serviceName: string;
  serviceCatalogId?: string | null;
  intervalMonths?: number | null;
  intervalKm?: number | null;
  priority: "standard" | "important" | "urgent";
  notes?: string;
}

export interface PostServiceDataInput {
  workOrderId: string;
  vehicleId: string;
  odometerReading?: number | null;
  recommendations: RecommendationInput[];
  mechanicNotes?: string;
}

export interface CompletionDataInput {
  workOrderId: string;
  vehicleId: string;
  odometerReading?: number | null;
  customerSatisfaction?: number | null;
  customerFeedback?: string | null;
  nextAppointmentDate?: string | null;
}

// ── Save post-service data (called when transitioning to "Ready for Pickup") ──

export async function savePostServiceData(
  input: PostServiceDataInput,
): Promise<{ recommendationsCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();

  const {
    workOrderId,
    vehicleId,
    odometerReading,
    recommendations,
    mechanicNotes,
  } = input;

  // 1. Validate
  if (!workOrderId) throw new ValidationError("Work order ID is required");

  // Delete existing recommendations for this work order to prevent duplicates on retry
  const { error: deleteError } = await supabase
    .from("service_recommendations")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId);

  if (deleteError) {
    throw new AppError(
      `Failed to clear old recommendations: ${deleteError.message}`,
      "DATABASE_ERROR",
      500,
    );
  }

  // Delete existing pending reminder logs for this vehicle and the service names we are recommending
  const serviceNames = recommendations.map((r) => r.serviceName);
  if (serviceNames.length > 0) {
    await supabase
      .from("reminder_logs")
      .delete()
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicleId)
      .eq("reminder_type", "service_due")
      .eq("status", "pending")
      .in("service_name", serviceNames);
  }

  // 2. Insert service_recommendations
  const recommendationRows: ServiceRecommendationInsert[] = recommendations.map(
    (r) => {
      let nextDueDate: string | null = null;
      if (r.intervalMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + r.intervalMonths);
        nextDueDate = d.toISOString().split("T")[0];
      }
      let nextDueKm: number | null = null;
      if (r.intervalKm && odometerReading) {
        nextDueKm = odometerReading + r.intervalKm;
      }

      return {
        organization_id: orgId,
        work_order_id: workOrderId,
        work_order_service_id: r.workOrderServiceId,
        service_name: r.serviceName,
        service_catalog_id: r.serviceCatalogId ?? null,
        recommended_interval_months: r.intervalMonths ?? null,
        recommended_interval_km: r.intervalKm ?? null,
        next_due_date: nextDueDate,
        next_due_km: nextDueKm,
        priority: r.priority,
        notes: r.notes?.trim() ?? null,
        created_by: user.id,
        updated_by: user.id,
      };
    },
  );

  if (recommendationRows.length > 0) {
    const { error: recError } = await supabase
      .from("service_recommendations")
      .insert(recommendationRows);

    if (recError)
      throw new AppError(
        `Failed to save recommendations: ${recError.message}`,
        "DATABASE_ERROR",
        500,
      );
  }

  // 3. Update work_order.odometer_at_service + notes
  const updateData: {
    odometer_at_service: number | null;
    updated_by: string;
    notes?: string | null;
  } = {
    odometer_at_service: odometerReading ?? null,
    updated_by: user.id,
  };
  if (mechanicNotes !== undefined) {
    updateData.notes = mechanicNotes.trim() || null;
  }

  const { error: woError } = await supabase
    .from("work_orders")
    .update(updateData)
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (woError)
    throw new AppError(
      `Failed to update work order: ${woError.message}`,
      "DATABASE_ERROR",
      500,
    );

  // 4. Update vehicle odometer if newer
  if (odometerReading) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("odometer")
      .eq("id", vehicleId)
      .maybeSingle();

    if (
      vehicle &&
      (vehicle.odometer === null || odometerReading > vehicle.odometer)
    ) {
      await supabase
        .from("vehicles")
        .update({ odometer: odometerReading })
        .eq("id", vehicleId);
    }
  }

  // 5. Upsert vehicle_service_schedules with mechanic-approved intervals
  await Promise.all(
    recommendations.map(async (rec) => {
      if (!rec.intervalMonths && !rec.intervalKm) return;

      const nextDueDate = rec.intervalMonths
        ? new Date(
            new Date().setMonth(new Date().getMonth() + rec.intervalMonths),
          )
            .toISOString()
            .split("T")[0]
        : null;

      const nextDueKm =
        rec.intervalKm && odometerReading
          ? odometerReading + rec.intervalKm
          : null;

      // Check for existing schedule for this vehicle + service name
      const { data: existing } = await supabase
        .from("vehicle_service_schedules")
        .select("id")
        .eq("organization_id", orgId)
        .eq("vehicle_id", vehicleId)
        .eq("service_name", rec.serviceName)
        .is("deleted_at", null)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("vehicle_service_schedules")
          .update({
            last_service_date: new Date().toISOString(),
            last_service_odometer: odometerReading ?? null,
            interval_months: rec.intervalMonths ?? null,
            interval_km: rec.intervalKm ?? null,
            next_due_date: nextDueDate,
            next_due_km: nextDueKm,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("vehicle_service_schedules").insert({
          organization_id: orgId,
          vehicle_id: vehicleId,
          service_name: rec.serviceName,
          service_catalog_id: rec.serviceCatalogId ?? null,
          interval_months: rec.intervalMonths ?? null,
          interval_km: rec.intervalKm ?? null,
          last_service_date: new Date().toISOString(),
          last_service_odometer: odometerReading ?? null,
          next_due_date: nextDueDate,
          next_due_km: nextDueKm,
          reminder_enabled: true,
          created_by: user.id,
          updated_by: user.id,
        });
      }

      // 6. Create reminder_log (pending, scheduled 2 weeks before next_due_date)
      if (nextDueDate) {
        const reminderDate = new Date(nextDueDate);
        reminderDate.setDate(reminderDate.getDate() - 14); // 2 weeks before

        const { data: wo } = await supabase
          .from("work_orders")
          .select("customer_id")
          .eq("id", workOrderId)
          .maybeSingle();

        await supabase.from("reminder_logs").insert({
          organization_id: orgId,
          vehicle_id: vehicleId,
          customer_id: wo?.customer_id ?? null,
          service_catalog_id: rec.serviceCatalogId ?? null,
          service_name: rec.serviceName,
          reminder_type: "service_due",
          channel: "in_app",
          status: "pending",
          scheduled_at: reminderDate.toISOString(),
        });
      }
    }),
  );

  // 7. Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.serviceSchedules(orgId), "max");

  return { recommendationsCount: recommendations.length };
}

// ── Save completion data (called when transitioning to "Completed") ──

export async function saveCompletionData(
  input: CompletionDataInput,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  const orgId = await getOrgId();

  const {
    workOrderId,
    vehicleId,
    odometerReading,
    customerSatisfaction,
    customerFeedback,
    nextAppointmentDate,
  } = input;

  // 1. Check if completion data already exists for this work order to make the operation idempotent
  const { data: existing } = await supabase
    .from("service_completion_data")
    .select("id")
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId)
    .maybeSingle();

  const row: ServiceCompletionDatumInsert = {
    organization_id: orgId,
    work_order_id: workOrderId,
    vehicle_id: vehicleId,
    odometer_reading: odometerReading ?? null,
    customer_satisfaction: customerSatisfaction ?? null,
    customer_feedback: customerFeedback?.trim() ?? null,
    customer_preferences: {} as Record<string, never>,
    next_appointment_date: nextAppointmentDate ?? null,
    created_by: user.id,
  };

  if (existing) {
    const { error } = await supabase
      .from("service_completion_data")
      .update({
        odometer_reading: odometerReading ?? null,
        customer_satisfaction: customerSatisfaction ?? null,
        customer_feedback: customerFeedback?.trim() ?? null,
        next_appointment_date: nextAppointmentDate ?? null,
      })
      .eq("id", existing.id);
    if (error)
      throw new AppError(
        `Failed to update completion data: ${error.message}`,
        "DATABASE_ERROR",
        500,
      );
  } else {
    const { error } = await supabase
      .from("service_completion_data")
      .insert(row);
    if (error)
      throw new AppError(
        `Failed to save completion data: ${error.message}`,
        "DATABASE_ERROR",
        500,
      );
  }

  // 2. Update vehicle last_visit_at
  await supabase
    .from("vehicles")
    .update({ last_visit_at: new Date().toISOString() })
    .eq("id", vehicleId);

  // 3. Update customer last_visit_at + increment total_visits
  const { data: wo } = await supabase
    .from("work_orders")
    .select("customer_id")
    .eq("id", workOrderId)
    .maybeSingle();

  if (wo?.customer_id) {
    if (!existing) {
      // Only increment visits count on the initial completion
      const { data: customer } = await supabase
        .from("customers")
        .select("total_visits")
        .eq("id", wo.customer_id)
        .maybeSingle();

      await supabase
        .from("customers")
        .update({
          last_visit_at: new Date().toISOString(),
          total_visits: (customer?.total_visits ?? 0) + 1,
        })
        .eq("id", wo.customer_id);
    } else {
      // Just update last_visit_at without double-counting visits
      await supabase
        .from("customers")
        .update({
          last_visit_at: new Date().toISOString(),
        })
        .eq("id", wo.customer_id);
    }
  }

  // 4. Create customer communication record
  if (wo?.customer_id && !existing) {
    // Only log the communication record on initial completion
    await supabase.from("customer_communications").insert({
      organization_id: orgId,
      customer_id: wo.customer_id,
      type: "in_person",
      direction: "outbound",
      subject: "Service Completed",
      content:
        "Service completed and customer received recommendations summary.",
      staff_id: user.id,
    });
  }

  // 5. Invalidate caches
  revalidateTag(cacheTags.workOrder(workOrderId), "max");
  revalidateTag(cacheTags.workOrders(orgId), "max");
}

// ── Get work order services with catalog intervals for the form ──

export interface EnrichedServiceItem {
  id: string;
  service_name: string;
  service_catalog_id: string | null;
  catalog_interval_months: number | null;
  catalog_interval_km: number | null;
}

export async function getWorkOrderServicesWithIntervals(
  workOrderId: string,
): Promise<EnrichedServiceItem[]> {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { data, error } = await supabase
    .from("work_order_services")
    .select(`
      id,
      service_name,
      service_catalog_id,
      service_catalog!left (
        interval_months,
        interval_km
      )
    `)
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId)
    .order("created_at");

  if (error)
    throw new AppError(
      `Failed to fetch services: ${error.message}`,
      "DATABASE_ERROR",
      500,
    );

  return (data ?? []).map((svc: Record<string, unknown>) => {
    const catalog = Array.isArray(svc.service_catalog)
      ? (svc.service_catalog[0] as {
          interval_months: number | null;
          interval_km: number | null;
        } | null)
      : (svc.service_catalog as {
          interval_months: number | null;
          interval_km: number | null;
        } | null);

    return {
      id: svc.id as string,
      service_name: svc.service_name as string,
      service_catalog_id: svc.service_catalog_id as string | null,
      catalog_interval_months: catalog?.interval_months ?? null,
      catalog_interval_km: catalog?.interval_km ?? null,
    };
  });
}

// ── Get work order parts for the post-service form ──

export interface WorkOrderPartItem {
  id: string;
  part_name: string;
  part_number: string | null;
  quantity: number;
  unit_price: number;
  final_price: number;
}

export async function getWorkOrderParts(
  workOrderId: string,
): Promise<WorkOrderPartItem[]> {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { data, error } = await supabase
    .from("work_order_parts")
    .select(`
      id,
      part_name,
      part_number,
      quantity,
      unit_price,
      final_price
    `)
    .eq("work_order_id", workOrderId)
    .eq("organization_id", orgId)
    .order("created_at");

  if (error)
    throw new AppError(
      `Failed to fetch parts: ${error.message}`,
      "DATABASE_ERROR",
      500,
    );

  return (data ?? []).map((part) => ({
    id: part.id,
    part_name: part.part_name,
    part_number: part.part_number,
    quantity: part.quantity,
    unit_price: Number(part.unit_price),
    final_price: Number(part.final_price),
  }));
}

// ── Get recommendations for a work order ──

export async function getRecommendations(workOrderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_recommendations")
    .select(
      "id, organization_id, branch_id, work_order_id, work_order_service_id, service_name, service_catalog_id, recommended_interval_months, recommended_interval_km, next_due_date, next_due_km, priority, notes, created_at, updated_at, deleted_at",
    )
    .eq("work_order_id", workOrderId)
    .is("deleted_at", null)
    .order("priority", { ascending: true });

  if (error)
    throw new AppError(
      `Failed to fetch recommendations: ${error.message}`,
      "DATABASE_ERROR",
      500,
    );
  return data ?? [];
}

// ── Get completion data for a work order ──

export async function getCompletionData(workOrderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_completion_data")
    .select(
      "id, organization_id, branch_id, work_order_id, vehicle_id, odometer_reading, customer_satisfaction, customer_feedback, customer_preferences, next_appointment_date, collected_at, created_by, created_at",
    )
    .eq("work_order_id", workOrderId)
    .maybeSingle();

  if (error) {
    throw new AppError(
      `Failed to fetch completion data: ${error.message}`,
      "DATABASE_ERROR",
      500,
    );
  }
  return data ?? null;
}
