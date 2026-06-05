import type { SupabaseClient } from "@supabase/supabase-js";
import { reportServerError } from "@/lib/sentry-report-server";

// System user used as created_by/updated_by for public booking records
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

// ── Types ───────────────────────────────────────────────────────

export interface BookingRequestParams {
  orgId: string;
  name: string;
  phone: string;
  plate: string;
  notes?: string;
  requestedDate?: string;
}

export interface BookingResult {
  appointmentId: string;
  customerId: string;
  vehicleId: string;
}

// ── Booking Orchestration ───────────────────────────────────────

/**
 * Submits a public booking request:
 * 1. Look up or create customer by phone
 * 2. Look up or create vehicle by plate
 * 3. Create appointment with status='requested'
 * 4. Send notification email (fire-and-forget)
 */
export async function submitBookingRequest(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
): Promise<BookingResult> {
  // 1. Resolve customer (lookup by phone, create if not found)
  const customer = await resolveCustomer(supabase, orgId, params);

  // 2. Resolve vehicle (lookup by plate, create if not found)
  const vehicle = await resolveVehicle(supabase, orgId, customer.id, params);

  // 3. Create appointment with status='requested'
  const appointment = await createBookingAppointment(
    supabase,
    orgId,
    customer.id,
    vehicle.id,
    params,
  );

  // 4. Send notification email (fire-and-forget — never block the response)
  sendBookingNotification(supabase, orgId, params).catch((err) => {
    reportServerError("Booking notification email failed:", err);
  });

  return {
    appointmentId: appointment.id,
    customerId: customer.id,
    vehicleId: vehicle.id,
  };
}

// ── Customer Resolution ─────────────────────────────────────────

async function resolveCustomer(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
) {
  // Look up existing customer by phone
  const { data: existing } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("organization_id", orgId)
    .eq("phone", params.phone)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      organization_id: orgId,
      type: "individual",
      first_name: params.name,
      phone: params.phone,
      source: "booking",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id, first_name, last_name, phone")
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return newCustomer;
}

// ── Vehicle Resolution ──────────────────────────────────────────

async function resolveVehicle(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string,
  params: BookingRequestParams,
) {
  // Look up existing vehicle by plate
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id, plate_number")
    .eq("organization_id", orgId)
    .eq("plate_number", params.plate)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  // Create new vehicle with "Unknown" make/model
  const { data: newVehicle, error } = await supabase
    .from("vehicles")
    .insert({
      organization_id: orgId,
      plate_number: params.plate,
      make: "Unknown",
      model: "Unknown",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id, plate_number")
    .single();

  if (error) throw new Error(`Failed to create vehicle: ${error.message}`);

  // Link vehicle to customer (non-fatal if fails)
  const { error: ownerError } = await supabase.from("vehicle_owners").insert({
    organization_id: orgId,
    vehicle_id: newVehicle.id,
    customer_id: customerId,
    is_primary: true,
    created_by: SYSTEM_USER_ID,
  });

  if (ownerError) {
    reportServerError("Failed to link vehicle to customer:", ownerError);
  }

  return newVehicle;
}

// ── Appointment Creation ────────────────────────────────────────

async function createBookingAppointment(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string,
  vehicleId: string,
  params: BookingRequestParams,
) {
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: `Online booking request from ${params.name}`,
      description: params.notes?.trim() ?? null,
      scheduled_at: params.requestedDate ?? new Date().toISOString(),
      status: "requested",
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return appointment;
}

// ── Email Notification ──────────────────────────────────────────

async function sendBookingNotification(
  supabase: SupabaseClient,
  orgId: string,
  params: BookingRequestParams,
) {
  // Fetch org name, notification_email, and branch email fallback
  const [{ data: org }, { data: settings }, { data: branch }] =
    await Promise.all([
      supabase.from("organizations").select("name").eq("id", orgId).single(),
      supabase
        .from("organization_settings")
        .select("notification_email")
        .eq("organization_id", orgId)
        .single(),
      supabase
        .from("branches")
        .select("email")
        .eq("organization_id", orgId)
        .eq("is_main", true)
        .maybeSingle(),
    ]);

  const orgName = org?.name ?? "Your Shop";
  const notificationEmail =
    settings?.notification_email ?? branch?.email ?? null;

  if (!notificationEmail) {
    console.warn(
      `No notification email configured for org ${orgId} — booking created without notification`,
    );
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tolom.app";
  const dashboardUrl = `${siteUrl}/dashboard/appointments`;

  // Dynamic import to avoid circular dependency
  const { sendBookingRequestEmail } = await import(
    "@/lib/services/email-service"
  );

  await sendBookingRequestEmail({
    to: notificationEmail,
    customerName: params.name,
    customerPhone: params.phone,
    vehiclePlate: params.plate,
    notes: params.notes ?? null,
    requestedDate: params.requestedDate ?? "As soon as possible",
    orgName,
    dashboardUrl,
  });
}
