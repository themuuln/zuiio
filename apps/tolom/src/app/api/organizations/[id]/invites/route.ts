import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {

  cancelInvite,
  createInvite,
  getOrgInvites,
  resendInvite,
} from "@/lib/services/invite-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId }) => {
  const invites = await getOrgInvites(orgId);
  return ok(invites);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const invite = await createInvite(supabase, orgId, body, user.id);
    return created(invite);
  },
  { rateLimit: true, subscription: true },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    if (body.action === "resend") {
      await resendInvite(supabase, orgId, body.inviteId);
    }
    return ok({ success: true });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    await cancelInvite(supabase, orgId, body.inviteId);
    return ok({ success: true });
  },
  { rateLimit: true, subscription: true },
);
