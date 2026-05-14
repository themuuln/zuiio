import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getOrganizationUsers } from "@/lib/services/user-service";
import { removeUser } from "@/lib/services/user-service";
import { createInvite } from "@/lib/services/invite-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const users = await getOrganizationUsers(orgId);
  return NextResponse.json({ data: users });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const invite = await createInvite(orgId, body, user.id);
  return NextResponse.json({ data: invite }, { status: 201 });
});

export const DELETE = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();
  await removeUser(body.userId, orgId);
  return NextResponse.json({ success: true });
});
