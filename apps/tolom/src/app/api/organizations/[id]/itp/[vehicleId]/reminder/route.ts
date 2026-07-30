import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { sendItpReminder } from "@/lib/services/itp-service";

/**
 * POST /api/organizations/[id]/itp/[vehicleId]/reminder
 *
 * Mark that an ITP reminder was sent for this vehicle.
 * This logs the action and updates itp_reminder_sent_at to prevent duplicate reminders.
 */
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params }) => {
    const vehicleId = params.vehicleId;

    if (!vehicleId) {
      return apiError("VALIDATION", "vehicleId is required", 400);
    }

    await sendItpReminder(supabase, vehicleId, orgId, user.id);

    return ok({ sent: true });
  },
  { rateLimit: true, requireOrg: true },
);
