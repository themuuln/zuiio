import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { closeSession } from "@/lib/services/cash-register-service";
// POST /api/organizations/[id]/cash-register/[sessionId]/close — close session
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params, request }) => {
    const body = await request.json();
    const { closing_balance, note } = body;

    if (closing_balance === undefined || closing_balance === null) {
      return apiError("VALIDATION_ERROR", "Closing balance is required", 400);
    }

    const session = await closeSession(
      supabase,
      params.sessionId,
      orgId,
      user.id,
      Number(closing_balance),
      note,
    );

    return ok(session);
  },
  { rateLimit: true },
);
