import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  getItpRecords,
  getItpStats,
  getExpiringItpRecords,
  recordItpInspection,
  getVehiclesNeedingReminder,
  type ItpInspectionParams,
} from "@/lib/services/itp-service";

/**
 * GET /api/organizations/[id]/itp
 *
 * Returns ITP records for all vehicles in the org.
 * Supports ?status=valid|expiring_soon|expired|unknown filter
 * Supports ?search= for plate/customer search
 * Supports ?branch_id= for branch filtering
 * Supports ?stats=true to get counts only
 * Supports ?expiring=true to get only vehicles expiring within 30 days
 * Supports ?needs_reminder=true to get vehicles needing reminder
 */
export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const url = request.nextUrl;
    const status = url.searchParams.get("status") as
      | "valid"
      | "expiring_soon"
      | "expired"
      | "unknown"
      | null;
    const branchId = url.searchParams.get("branch_id");
    const search = url.searchParams.get("search") ?? undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const statsOnly = url.searchParams.get("stats") === "true";
    const expiringOnly = url.searchParams.get("expiring") === "true";
    const needsReminder = url.searchParams.get("needs_reminder") === "true";

    // Stats only (for dashboard widget)
    if (statsOnly) {
      const stats = await getItpStats(supabase, orgId, branchId);
      return ok(stats);
    }

    // Expiring only (for notifications)
    if (expiringOnly) {
      const records = await getExpiringItpRecords(supabase, orgId, branchId);
      return ok(records);
    }

    // Vehicles needing reminder
    if (needsReminder) {
      const records = await getVehiclesNeedingReminder(supabase, orgId);
      return ok(records);
    }

    // Full record list
    const result = await getItpRecords(supabase, orgId, {
      status: status ?? undefined,
      branchId,
      search,
      limit,
      offset,
    });

    return ok(result);
  },
  { requireOrg: true },
);

/**
 * POST /api/organizations/[id]/itp
 *
 * Record an ITP inspection pass for a vehicle.
 * Body: { vehicle_id, itp_expiry_date, itp_last_passed_date, itp_notes?, branch_id? }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = (await request.json()) as ItpInspectionParams;

    // Validation
    if (!body.vehicle_id?.trim()) {
      return apiError("VALIDATION", "vehicle_id is required", 400);
    }
    if (!body.itp_expiry_date) {
      return apiError("VALIDATION", "itp_expiry_date is required", 400);
    }
    if (!body.itp_last_passed_date) {
      return apiError("VALIDATION", "itp_last_passed_date is required", 400);
    }

    // Validate date format
    const expiryDate = new Date(body.itp_expiry_date);
    const passedDate = new Date(body.itp_last_passed_date);

    if (isNaN(expiryDate.getTime())) {
      return apiError("VALIDATION", "Invalid itp_expiry_date format", 400);
    }
    if (isNaN(passedDate.getTime())) {
      return apiError(
        "VALIDATION",
        "Invalid itp_last_passed_date format",
        400,
      );
    }

    const result = await recordItpInspection(
      supabase,
      orgId,
      user.id,
      body,
    );

    return created(result);
  },
  { rateLimit: true, requireOrg: true },
);
