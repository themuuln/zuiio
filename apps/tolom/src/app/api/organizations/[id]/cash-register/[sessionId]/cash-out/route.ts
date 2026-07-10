import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created } from "@/lib/api-response";
import { addCashOut } from "@/lib/services/cash-register-service";

export { dynamic } from "@/lib/api-handler";

// POST /api/organizations/[id]/cash-register/[sessionId]/cash-out — record cash out
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params, request }) => {
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || Number(amount) <= 0) {
      return apiError("VALIDATION_ERROR", "Amount must be positive", 400);
    }

    if (!description) {
      return apiError("VALIDATION_ERROR", "Description is required", 400);
    }

    const entry = await addCashOut(
      supabase,
      params.sessionId,
      orgId,
      user.id,
      Number(amount),
      description,
    );

    return created(entry);
  },
  { rateLimit: true },
);
