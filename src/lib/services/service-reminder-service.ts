import { revalidateTag } from "next/cache";
import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type {
  VehicleServiceSchedule,
  ReminderLog,
} from "@/lib/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// ----------------------------------------------------------
// Vehicle Service Schedules
// ----------------------------------------------------------

export async function getServiceSchedules(
  orgId: string,
  vehicleId?: string,
): Promise<VehicleServiceSchedule[]> {
  const supabase = await createClient();

  return withCache(
    ["getServiceSchedules", orgId, vehicleId ?? ""],
    async () => {
      let query = supabase
        .from("vehicle_service_schedules")
        .select(
          "*, vehicle:vehicles(plate_number, make, model, year), service:service_catalog(name)",
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("next_due_date", { ascending: true, nullsFirst: false });

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      const { data, error } = await query;

      if (error)
        throw new Error(error.message ?? "Failed to fetch service schedules");
      return data ?? [];
    },
    {
      tags: [cacheTags.serviceSchedules(orgId)],
      revalidate: cacheDurations.serviceSchedules,
    },
  );
}

export async function getServiceSchedule(
  id: string,
): Promise<VehicleServiceSchedule> {
  const supabase = await createClient();

  return withCache(
    ["getServiceSchedule", id],
    async () => {
      const { data, error } = await supabase
        .from("vehicle_service_schedules")
        .select(
          "*, vehicle:vehicles!inner(plate_number, make, model, year, customer_id), service:service_catalog!left(name)",
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !data)
        throw new NotFoundError("Service schedule not found");
      return data;
    },
    {
      tags: [cacheTags.serviceSchedule(id)],
      revalidate: cacheDurations.serviceSchedules,
    },
  );
}

export async function createServiceSchedule(
  orgId: string,
  userId: string,
  params: {
    vehicle_id?: string;
    service_catalog_id?: string;
    service_name: string;
    interval_months?: number | null;
    interval_km?: number | null;
    last_service_date?: string | null;
    last_service_odometer?: number | null;
    next_due_date?: string | null;
    next_due_km?: number | null;
    notes?: string;
  },
): Promise<VehicleServiceSchedule> {
  if (!params.service_name?.trim())
    throw new ValidationError("Service name is required");
  if (!params.interval_months && !params.interval_km)
    throw new ValidationError(
      "At least one interval type (months or km) must be set",
    );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicle_service_schedules")
    .insert({
      organization_id: orgId,
      vehicle_id: params.vehicle_id?.trim() ?? null,
      service_catalog_id: params.service_catalog_id?.trim() ?? null,
      service_name: params.service_name.trim(),
      interval_months: params.interval_months ?? null,
      interval_km: params.interval_km ?? null,
      last_service_date: params.last_service_date ?? null,
      last_service_odometer: params.last_service_odometer ?? null,
      next_due_date: params.next_due_date ?? null,
      next_due_km: params.next_due_km ?? null,
      notes: params.notes?.trim() ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create service schedule");

  revalidateTag(cacheTags.serviceSchedules(orgId), "max");

  return data;
}

export async function updateServiceSchedule(
  id: string,
  orgId: string,
  userId: string,
  params: {
    service_catalog_id?: string | null;
    service_name?: string;
    interval_months?: number | null;
    interval_km?: number | null;
    last_service_date?: string | null;
    last_service_odometer?: number | null;
    next_due_date?: string | null;
    next_due_km?: number | null;
    reminder_enabled?: boolean;
    notes?: string | null;
  },
): Promise<VehicleServiceSchedule> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (params.service_name !== undefined)
    updates.service_name = params.service_name.trim();
  if (params.service_catalog_id !== undefined)
    updates.service_catalog_id = params.service_catalog_id?.trim() ?? null;
  if (params.interval_months !== undefined)
    updates.interval_months = params.interval_months;
  if (params.interval_km !== undefined) updates.interval_km = params.interval_km;
  if (params.last_service_date !== undefined)
    updates.last_service_date = params.last_service_date;
  if (params.last_service_odometer !== undefined)
    updates.last_service_odometer = params.last_service_odometer;
  if (params.next_due_date !== undefined)
    updates.next_due_date = params.next_due_date;
  if (params.next_due_km !== undefined) updates.next_due_km = params.next_due_km;
  if (params.reminder_enabled !== undefined)
    updates.reminder_enabled = params.reminder_enabled;
  if (params.notes !== undefined) updates.notes = params.notes?.trim() ?? null;

  const { data, error } = await supabase
    .from("vehicle_service_schedules")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data)
    throw new NotFoundError("Service schedule not found");

  revalidateTag(cacheTags.serviceSchedules(orgId), "max");
  revalidateTag(cacheTags.serviceSchedule(id), "max");

  return data;
}

export async function deleteServiceSchedule(
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_service_schedules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Service schedule not found");

  revalidateTag(cacheTags.serviceSchedules(orgId), "max");
  revalidateTag(cacheTags.serviceSchedule(id), "max");
}

// ----------------------------------------------------------
// Auto-Sync: Work Order → Service Schedules
// ----------------------------------------------------------

/**
 * When a work order is marked "Completed", this function:
 * 1. Finds all services performed on the work order
 * 2. For each service, looks up the default interval from service_catalog
 * 3. Creates or updates the vehicle_service_schedule
 *
 * Returns the number of schedules created/updated.
 */
export async function syncWorkOrderToSchedules(
  workOrderId: string,
): Promise<number> {
  const supabase = await createClient();

  // Get the work order with its vehicle and services
  const { data: wo, error: woError } = await supabase
    .from("work_orders")
    .select("id, organization_id, vehicle_id, completed_at")
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .single();

  if (woError || !wo || !wo.vehicle_id) return 0;

  const { data: services, error: svcError } = await supabase
    .from("work_order_services")
    .select(
      "service_catalog_id, service_name, service_catalog!left(interval_months, interval_km)",
    )
    .eq("work_order_id", workOrderId);

  if (svcError || !services || services.length === 0) return 0;

  const completedDate = wo.completed_at ?? new Date().toISOString();
  let updatedCount = 0;

  for (const svc of services) {
    const catalog = Array.isArray(svc.service_catalog)
      ? (svc.service_catalog[0] as { interval_months: number | null; interval_km: number | null } | null)
      : (svc.service_catalog as unknown as { interval_months: number | null; interval_km: number | null } | null);

    const intervalMonths = catalog?.interval_months ?? null;
    const intervalKm = catalog?.interval_km ?? null;

    let nextDueDate: string | null = null;
    if (intervalMonths) {
      const next = new Date(completedDate);
      next.setMonth(next.getMonth() + intervalMonths);
      nextDueDate = next.toISOString().split("T")[0];
    }

    const { data: existing } = await supabase
      .from("vehicle_service_schedules")
      .select("id")
      .eq("organization_id", wo.organization_id)
      .eq("vehicle_id", wo.vehicle_id)
      .eq("service_name", svc.service_name)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = {
        last_service_date: completedDate,
        next_due_date: nextDueDate,
        updated_at: new Date().toISOString(),
      };
      if (intervalMonths) updates.interval_months = intervalMonths;
      if (intervalKm) updates.interval_km = intervalKm;

      await supabase
        .from("vehicle_service_schedules")
        .update(updates)
        .eq("id", existing.id);
    } else {
      await supabase.from("vehicle_service_schedules").insert({
        organization_id: wo.organization_id,
        vehicle_id: wo.vehicle_id,
        service_catalog_id: svc.service_catalog_id,
        service_name: svc.service_name,
        interval_months: intervalMonths,
        interval_km: intervalKm,
        last_service_date: completedDate,
        next_due_date: nextDueDate,
        reminder_enabled: true,
      });
    }

    updatedCount++;
  }

  if (updatedCount > 0) {
    revalidateTag(cacheTags.serviceSchedules(wo.organization_id), "max");
  }

  return updatedCount;
}

// ----------------------------------------------------------
// Backfill: Sync all completed work orders to schedules
// ----------------------------------------------------------

/**
 * Scans all completed work orders in an org and syncs their services
 * into vehicle_service_schedules. Idempotent — safe to re-run.
 */
export async function backfillSchedulesFromHistory(
  orgId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: completedWOs, error } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (error || !completedWOs) return 0;

  let totalSynced = 0;
  for (const wo of completedWOs) {
    const count = await syncWorkOrderToSchedules(wo.id);
    totalSynced += count;
  }

  return totalSynced;
}

// ----------------------------------------------------------
// Reminder Logs
// ----------------------------------------------------------

export async function getReminderLogs(
  orgId: string,
  vehicleId?: string,
): Promise<ReminderLog[]> {
  const supabase = await createClient();

  return withCache(
    ["getReminderLogs", orgId, vehicleId ?? ""],
    async () => {
      let query = supabase
        .from("reminder_logs")
        .select(
          "*, vehicle:vehicles!inner(plate_number, make, model), customer:customers!left(first_name, last_name, phone)",
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      const { data, error } = await query;

      if (error)
        throw new Error(error.message ?? "Failed to fetch reminder logs");
      return data ?? [];
    },
    {
      tags: [cacheTags.reminderLogs(orgId)],
      revalidate: cacheDurations.reminderLogs,
    },
  );
}

// ----------------------------------------------------------
// Send Pending Reminders
// ----------------------------------------------------------

/**
 * Scans all pending reminder_logs for the org, sends email reminders,
 * and updates their status to "sent".
 * Returns the number of reminders sent.
 */
export async function sendPendingReminders(
  orgId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("reminder_logs")
    .select(
      `*,
      vehicle:vehicles!inner(plate_number, make, model),
      customer:customers!left(first_name, last_name, phone, email)`,
    )
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .in("channel", ["email", "both"])
    .not("customer_id", "is", null)
    .limit(50);

  if (error || !logs || logs.length === 0) return 0;

  const { sendReminderEmail } = await import("@/lib/services/email-service");
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();
  const orgName = org?.name ?? "Your Garage";

  let sentCount = 0;

  for (const log of logs) {
    const customer = Array.isArray(log.customer)
      ? log.customer[0]
      : log.customer;
    const vehicle = Array.isArray(log.vehicle)
      ? log.vehicle[0]
      : log.vehicle;

    const recipientEmail = customer?.email;
    if (!recipientEmail) continue;

    const customerName = [
      customer?.first_name,
      customer?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Valued Customer";

    const vehicleLabel = vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.plate_number})`
      : "your vehicle";

    const dueDate = log.scheduled_at
      ? new Date(log.scheduled_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "soon";

    try {
      await sendReminderEmail({
        recipientEmail,
        customerName,
        vehicleLabel,
        serviceName: log.service_name,
        orgName,
        dueDate,
      });

      await supabase
        .from("reminder_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", log.id);

      sentCount++;
    } catch (err) {
      console.error(`Failed to send reminder ${log.id}:`, err);
      await supabase
        .from("reminder_logs")
        .update({
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", log.id);
    }
  }

  if (sentCount > 0) {
    revalidateTag(cacheTags.reminderLogs(orgId), "max");
  }

  return sentCount;
}

export async function createReminderLog(
  orgId: string,
  params: {
    vehicle_service_schedule_id?: string;
    vehicle_id: string;
    customer_id?: string;
    service_catalog_id?: string;
    service_name: string;
    reminder_type?: "service_due" | "service_overdue" | "custom";
    channel?: "sms" | "email" | "both" | "in_app";
    status?: "pending" | "sent" | "failed" | "cancelled";
    scheduled_at?: string;
    error_message?: string;
  },
): Promise<ReminderLog> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reminder_logs")
    .insert({
      organization_id: orgId,
      vehicle_service_schedule_id: params.vehicle_service_schedule_id ?? null,
      vehicle_id: params.vehicle_id,
      customer_id: params.customer_id ?? null,
      service_catalog_id: params.service_catalog_id ?? null,
      service_name: params.service_name,
      reminder_type: params.reminder_type ?? "service_due",
      channel: params.channel ?? "in_app",
      status: params.status ?? "pending",
      scheduled_at: params.scheduled_at ?? new Date().toISOString(),
      error_message: params.error_message ?? null,
    })
    .select("*")
    .single();

  if (error)
    throw new Error(error?.message ?? "Failed to create reminder log");

  revalidateTag(cacheTags.reminderLogs(orgId), "max");

  return data;
}
