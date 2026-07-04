import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import { capture } from "@/lib/capture";
import type {
  Appointment,
  AppointmentDetail,
  AppointmentStatus,
  CreateAppointmentParams,
  UpdateAppointmentParams,
} from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────

async function getOrgId(db: SupabaseClient): Promise<string> {
  const supabase = db;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) capture(authError);
  if (!user) throw new UnauthorizedError();
  const { data, error: rpcError } = await supabase.rpc("get_user_organization_id");
  if (rpcError) capture(rpcError);
  if (!data) throw new UnauthorizedError("Choose an organization to continue");
  return data;
}

// ── Get Appointments ──────────────────────────────────────────

export async function getAppointments(
  db: SupabaseClient,
  params?: {
    status?: AppointmentStatus;
    mechanic_id?: string;
    date?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: string;
    branchId?: string;
  },
): Promise<AppointmentDetail[]> {
  const supabase = db;
  const orgId = await getOrgId(db);

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone),
      vehicle:vehicles(plate_number, make, model, color),
      estimate:estimates(id, estimate_number, status, grand_total),
      mechanic_profile:profiles!appointments_mechanic_id_fkey(id, full_name)
    `,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.mechanic_id) query = query.eq("mechanic_id", params.mechanic_id);
  if (params?.customer_id) query = query.eq("customer_id", params.customer_id);
  if (params?.branchId) query = withBranchFilter(query, params.branchId);

  if (params?.date) {
    query = query
      .gte("scheduled_at", `${params.date}T00:00:00`)
      .lte("scheduled_at", `${params.date}T23:59:59`);
  }
  if (params?.date_from) query = query.gte("scheduled_at", params.date_from);
  if (params?.date_to) query = query.lte("scheduled_at", params.date_to);

  const { data, error } = await query;
  if (error) capture(error);
  const appointments = (data ?? []) as unknown as (Appointment & {
    customer: Record<string, unknown> | null;
    vehicle: Record<string, unknown> | null;
    estimate: Record<string, unknown> | null;
    mechanic_profile: { id: string; full_name: string | null } | null;
  })[];

  return appointments.map((a) => ({
    ...a,
    mechanic: a.mechanic_profile
      ? { id: a.mechanic_profile.id, full_name: a.mechanic_profile.full_name }
      : a.mechanic_id
        ? { id: a.mechanic_id, full_name: null }
        : null,
  })) as unknown as AppointmentDetail[];
}

// ── Get Single Appointment ────────────────────────────────────

/**
 * Fetches a single appointment by ID with customer, vehicle, and
 * linked estimate data. Returns null if not found or deleted.
 */
export async function getAppointment(
  db: SupabaseClient,
  id: string,
): Promise<AppointmentDetail | null> {
  const supabase = db;
  const orgId = await getOrgId(db);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      customer:customers(first_name, last_name, phone),
      vehicle:vehicles(plate_number, make, model, color),
      estimate:estimates(id, estimate_number, status, grand_total),
      mechanic_profile:profiles!appointments_mechanic_id_fkey(id, full_name)
    `,
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();
  if (error) capture(error);

  if (!data) return null;

  const appointment = data as unknown as Appointment & {
    customer: Record<string, unknown> | null;
    vehicle: Record<string, unknown> | null;
    estimate: Record<string, unknown> | null;
    mechanic_profile: { id: string; full_name: string | null } | null;
  };

  return {
    ...appointment,
    mechanic: appointment.mechanic_profile
      ? {
          id: appointment.mechanic_profile.id,
          full_name: appointment.mechanic_profile.full_name,
        }
      : appointment.mechanic_id
        ? { id: appointment.mechanic_id, full_name: null }
        : null,
  } as unknown as AppointmentDetail;
}

// ── Create Appointment ────────────────────────────────────────

/**
 * Creates a new appointment with basic validation.
 * Status defaults to "scheduled".
 * Returns the full AppointmentDetail.
 */
export async function createAppointment(
  db: SupabaseClient,
  params: CreateAppointmentParams,
): Promise<AppointmentDetail> {
  if (!params.customer_id) throw new ValidationError("Customer is required");
  if (!params.vehicle_id) throw new ValidationError("Vehicle is required");
  if (!params.title?.trim()) throw new ValidationError("Title is required");
  if (!params.scheduled_at) throw new ValidationError("Date/time is required");

  const supabase = db;
  const orgId = await getOrgId(db);
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new UnauthorizedError();

  const resolvedBranchId = await resolveBranchId(
    supabase,
    orgId,
    params.branchId,
    { strict: false },
  );

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      customer_id: params.customer_id,
      vehicle_id: params.vehicle_id,
      title: params.title.trim(),
      description: params.description?.trim() ?? null,
      scheduled_at: params.scheduled_at,
      end_at: params.end_at ?? null,
      mechanic_id: params.mechanic_id ?? null,
      notes: params.notes?.trim() ?? null,
      source_estimate_id: params.source_estimate_id ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create appointment");
  }

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "appointments",
    record_id: data.id,
    user_id: user.id,
    organization_id: orgId,
    new_data: data,
  });

  revalidateTag(cacheTags.appointments(orgId), "default");

  const created = await getAppointment(db, data.id);
  if (!created) throw new Error("Failed to fetch created appointment");
  return created;
}

// ── Update Appointment ────────────────────────────────────────

/**
 * Updates appointment fields. Only provided fields are changed.
 * Status transitions are allowed for all values in AppointmentStatus.
 */
export async function updateAppointment(
  db: SupabaseClient,
  id: string,
  params: UpdateAppointmentParams,
): Promise<AppointmentDetail> {
  const supabase = db;
  const orgId = await getOrgId(db);
  const user = (await supabase.auth.getUser()).data.user;

  const { data: existingRecord, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "id, title, scheduled_at, description, notes, mechanic_id, status, customer_id, vehicle_id",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();
  if (fetchError) capture(fetchError);

  const updates: Record<string, unknown> = { updated_by: user?.id ?? null };

  if (params.title !== undefined) updates.title = params.title.trim();
  if (params.scheduled_at !== undefined)
    updates.scheduled_at = params.scheduled_at;
  if (params.end_at !== undefined) updates.end_at = params.end_at;
  if (params.description !== undefined)
    updates.description = params.description?.trim() ?? null;
  if (params.notes !== undefined) updates.notes = params.notes?.trim() ?? null;
  if (params.mechanic_id !== undefined)
    updates.mechanic_id = params.mechanic_id;
  if (params.status !== undefined) updates.status = params.status;

  const { error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Appointment not found");

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "appointments",
    record_id: id,
    user_id: user?.id,
    organization_id: orgId,
    old_data: existingRecord as Record<string, unknown> | undefined,
  });

  revalidateTag(cacheTags.appointments(orgId), "default");

  const updated = await getAppointment(db, id);
  if (!updated) throw new NotFoundError("Appointment not found");
  return updated;
}

// ── Update Appointment Status ─────────────────────────────────

/**
 * Quick status change helper. Shorthand for updateAppointment with just status.
 */
export async function updateAppointmentStatus(
  db: SupabaseClient,
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentDetail> {
  return updateAppointment(db, id, { status });
}

// ── Delete Appointment ────────────────────────────────────────

/**
 * Soft-deletes an appointment by setting deleted_at.
 */
export async function deleteAppointment(
  db: SupabaseClient,
  id: string,
): Promise<void> {
  const supabase = db;
  const orgId = await getOrgId(db);
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data: existingRecord, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "id, title, scheduled_at, description, notes, mechanic_id, status, customer_id, vehicle_id",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();
  if (fetchError) capture(fetchError);

  const { error } = await supabase
    .from("appointments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Appointment not found");

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "appointments",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existingRecord as Record<string, unknown> | undefined,
  });

  revalidateTag(cacheTags.appointments(orgId), "default");
}
