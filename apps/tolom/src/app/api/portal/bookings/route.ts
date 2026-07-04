import { apiError, created } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";

/**
 * POST /api/portal/bookings
 *
 * Creates a booking request from an authenticated portal customer.
 * The customer is already known — pre-fills from the portal session.
 */
export const POST = createPortalRouteHandler(
  async ({ request, customer, supabase }) => {
    const body = await request.json();

    // Validate
    if (!body.vehicle_id) {
      return apiError("VALIDATION", "Vehicle is required", 400);
    }

    // Create appointment directly (cannot reuse createAppointment which calls getOrgId())
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        organization_id: customer.organization_id,
        customer_id: customer.id,
        vehicle_id: body.vehicle_id,
        title: `Online booking request from ${customer.first_name ?? "Customer"}`,
        description: body.notes?.trim() ?? null,
        scheduled_at: body.requestedDate ?? new Date().toISOString(),
        status: "requested",
        created_by: customer.id,
        updated_by: customer.id,
      })
      .select("id")
      .single();

    if (error) {
      return apiError("ERROR", "Failed to create booking", 500);
    }

    return created({
      id: appointment.id,
      message:
        "Booking request submitted. The shop will contact you to confirm.",
    });
  },
);
