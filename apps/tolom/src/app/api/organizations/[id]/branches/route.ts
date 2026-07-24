import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { createBranch, getBranches } from "@/lib/services/branch-service";
export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const branches = await getBranches(supabase, orgId);
    return ok(branches);
  },
  { requiredPermission: { resource: "branches", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase, user }) => {
    const body = await request.json();
    const branch = await createBranch(supabase, orgId, body, user.id);
    return created(branch);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "branches", action: "create" },
  },
);
