import { apiError, created } from "@/lib/api-response";
import { createPublicBookingHandler } from "@/lib/public-booking-handler";
import { submitBookingRequest } from "@/lib/services/booking-service";
/**
 * POST /api/booking/[token]
 *
 * Public endpoint for submitting a booking request.
 * No authentication required — org resolved from the booking_token URL param.
 *
 * Body: { name, phone, plate, notes?, requestedDate? }
 */
export const POST = createPublicBookingHandler(
  async ({ request, org, supabase }) => {
    const body = await request.json();

    // ── Validation ─────────────────────────────────────────────
    if (!body.name?.trim()) {
      return apiError("VALIDATION", "Name is required", 400);
    }
    if (!body.phone?.trim()) {
      return apiError("VALIDATION", "Phone number is required", 400);
    }
    if (!body.plate?.trim()) {
      return apiError("VALIDATION", "Vehicle plate is required", 400);
    }

    // ── Submit booking ──────────────────────────────────────────
    const result = await submitBookingRequest(supabase, org.id, {
      orgId: org.id,
      name: body.name.trim(),
      phone: body.phone.trim(),
      plate: body.plate.trim(),
      notes: body.notes?.trim(),
      requestedDate: body.requestedDate,
    });

    return created({
      id: result.appointmentId,
      message:
        "Booking request submitted. The shop will contact you to confirm.",
    });
  },
);
