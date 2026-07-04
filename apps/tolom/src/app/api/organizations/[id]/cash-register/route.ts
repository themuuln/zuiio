import { ok, created, apiError } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getCurrentSession,
  openSession,
} from "@/lib/services/cash-register-service";

// GET /api/organizations/[id]/cash-register — get current session
export const GET = createRouteHandler(async ({ orgId, supabase, request }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");

  const session = await getCurrentSession(
    supabase,
    orgId,
    branchId || undefined,
  );

  return ok(session);
});

// POST /api/organizations/[id]/cash-register — open new session
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, request }) => {
    const body = await request.json();
    const { opening_balance, branch_id } = body;

    if (opening_balance === undefined || opening_balance === null) {
      return apiError("VALIDATION_ERROR", "Opening balance is required", 400);
    }

    const session = await openSession(
      supabase,
      orgId,
      user.id,
      Number(opening_balance),
      branch_id,
    );

    return created(session);
  },
  { rateLimit: true },
);
