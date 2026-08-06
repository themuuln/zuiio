import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  createSession,
  listSessions,
} from "@/lib/services/stock-count-service";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const limit = Number(searchParams.get("limit")) || 20;
    const sessions = await listSessions(supabase, orgId, status, limit);
    return ok(sessions);
  },
  {
    requiredPermission: { resource: "inventory", action: "read" },
  },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const session = await createSession(
      supabase,
      orgId,
      user.id,
      body.branchId ?? null,
      body.notes ?? null,
    );
    return created(session);
  },
  {
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
