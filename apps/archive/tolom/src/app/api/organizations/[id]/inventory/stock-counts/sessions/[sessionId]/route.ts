import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import {
  cancelSession,
  getSession,
  reconcileSession,
} from "@/lib/services/stock-count-service";

export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const { sessionId } = params;
    const session = await getSession(supabase, sessionId);
    return ok(session);
  },
  {
    requiredPermission: { resource: "inventory", action: "read" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { sessionId } = params;
    const body = await request.json();
    const { action } = body;

    if (action === "reconcile") {
      return ok(await reconcileSession(supabase, orgId, sessionId, user.id));
    }
    if (action === "cancel") {
      return ok(await cancelSession(supabase, orgId, sessionId));
    }
    return ok(await getSession(supabase, sessionId));
  },
  {
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
