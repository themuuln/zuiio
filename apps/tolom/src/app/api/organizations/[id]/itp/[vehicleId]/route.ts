import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  getItpRecord,
  updateItpRecord,
  getItpHistory,
  type ItpRecordInput,
} from "@/lib/services/itp-service";

/**
 * GET /api/organizations/[id]/itp/[vehicleId]
 *
 * Returns the ITP record for a single vehicle.
 * ?include_history=true also returns the audit trail.
 */
export const GET = createRouteHandler(
  async ({ request, orgId, supabase, params }) => {
    const vehicleId = params.vehicleId;

    if (!vehicleId) {
      return apiError("VALIDATION", "vehicleId is required", 400);
    }

    const includeHistory =
      request.nextUrl.searchParams.get("include_history") === "true";

    const itpRecord = await getItpRecord(supabase, vehicleId, orgId);

    if (includeHistory) {
      const history = await getItpHistory(supabase, vehicleId, orgId);
      return ok({ ...itpRecord, history });
    }

    return ok(itpRecord);
  },
  { requireOrg: true },
);

/**
 * PATCH /api/organizations/[id]/itp/[vehicleId]
 *
 * Update ITP fields on a vehicle (without recording a new inspection).
 * Body (all optional): { itp_expiry_date?, itp_last_passed_date?, itp_notes? }
 */
export const PATCH = createRouteHandler(
  async ({ request, orgId, user, supabase, params }) => {
    const vehicleId = params.vehicleId;

    if (!vehicleId) {
      return apiError("VALIDATION", "vehicleId is required", 400);
    }

    const body = (await request.json()) as ItpRecordInput;

    // Validate at least one field is provided
    if (
      body.itp_expiry_date === undefined &&
      body.itp_last_passed_date === undefined &&
      body.itp_notes === undefined
    ) {
      return apiError(
        "VALIDATION",
        "At least one ITP field must be provided",
        400,
      );
    }

    // Validate date formats if provided
    if (body.itp_expiry_date) {
      const d = new Date(body.itp_expiry_date);
      if (isNaN(d.getTime())) {
        return apiError("VALIDATION", "Invalid itp_expiry_date format", 400);
      }
    }
    if (body.itp_last_passed_date) {
      const d = new Date(body.itp_last_passed_date);
      if (isNaN(d.getTime())) {
        return apiError(
          "VALIDATION",
          "Invalid itp_last_passed_date format",
          400,
        );
      }
    }

    const result = await updateItpRecord(
      supabase,
      vehicleId,
      orgId,
      user.id,
      body,
    );

    return ok(result);
  },
  { rateLimit: true, requireOrg: true },
);
