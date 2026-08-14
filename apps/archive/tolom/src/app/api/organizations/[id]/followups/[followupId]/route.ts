import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  cancelFollowup,
  completeFollowup,
  deleteFollowup,
  getFollowup,
  updateFollowup,
} from "@/lib/services/followup-service";
/**
 * GET /api/organizations/[id]/followups/[followupId]
 */
export const GET = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const followup = await getFollowup(supabase, params.followupId, orgId);

    if (!followup) {
      return apiError("NOT_FOUND", "Follow-up not found", 404);
    }

    return ok(followup);
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

/**
 * PATCH /api/organizations/[id]/followups/[followupId]
 *
 * Supports:
 * - Normal field updates via body
 * - Complete: body { action: "complete", outcome: "...", outcome_notes: "..." }
 * - Cancel: body { action: "cancel" }
 */
export const PATCH = createRouteHandler(
  async ({ params, request, supabase, orgId }) => {
    const body = await request.json();

    let followup: Awaited<ReturnType<typeof completeFollowup>>;

    if (body.action === "complete") {
      followup = await completeFollowup(
        supabase,
        params.followupId,
        orgId,
        body.outcome,
        body.outcome_notes,
      );
    } else if (body.action === "cancel") {
      followup = await cancelFollowup(supabase, params.followupId, orgId);
    } else {
      const { action: _action, ...updates } = body;
      followup = await updateFollowup(
        supabase,
        params.followupId,
        orgId,
        updates,
      );
    }

    return ok(followup);
  },
  { requiredPermission: { resource: "customers", action: "update" } },
);

/**
 * DELETE /api/organizations/[id]/followups/[followupId]
 */
export const DELETE = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    await deleteFollowup(supabase, params.followupId, orgId);
    return ok({ deleted: true });
  },
  { requiredPermission: { resource: "customers", action: "update" } },
);
