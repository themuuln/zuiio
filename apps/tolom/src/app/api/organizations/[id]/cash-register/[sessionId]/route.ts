import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getSession, voidSession } from "@/lib/services/cash-register-service";
// GET /api/organizations/[id]/cash-register/[sessionId] — get session detail
export const GET = createRouteHandler(async ({ orgId, supabase, params }) => {
  const session = await getSession(supabase, params.sessionId, orgId);
  return ok(session);
});

// DELETE /api/organizations/[id]/cash-register/[sessionId] — void session
export const DELETE = createRouteHandler(
  async ({ orgId, user, supabase, params }) => {
    await voidSession(supabase, params.sessionId, orgId, user.id);
    return ok({ success: true });
  },
  { rateLimit: true },
);
