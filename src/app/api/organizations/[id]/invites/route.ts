import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  cancelInvite,
  createInvite,
  getOrgInvites,
  resendInvite,
} from "@/lib/services/invite-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const invites = await getOrgInvites(orgId);
  return NextResponse.json({ data: invites });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user }) => {
    await requireActiveSubscription(orgId);
    const body = await request.json();
    const invite = await createInvite(orgId, body, user.id);
    return NextResponse.json({ data: invite }, { status: 201 });
  },
);

export const PATCH = createRouteHandler(async ({ request }) => {
  const body = await request.json();
  if (body.action === "resend") {
    await resendInvite(body.inviteId);
  }
  return NextResponse.json({ success: true });
});

export const DELETE = createRouteHandler(async ({ request }) => {
  const body = await request.json();
  await cancelInvite(body.inviteId);
  return NextResponse.json({ success: true });
});
