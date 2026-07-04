import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { getSessions } from "@/lib/services/cash-register-service";

// GET /api/organizations/[id]/cash-register/sessions — list sessions
export const GET = createRouteHandler(async ({ orgId, supabase, request }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  const result = await getSessions(supabase, orgId, {
    status,
    from,
    to,
    limit,
    offset,
  });

  return ok(result);
});
