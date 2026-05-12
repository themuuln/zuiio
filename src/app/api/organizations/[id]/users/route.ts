import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getOrganizationUsers, inviteUser } from "@/lib/services/user-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const users = await getOrganizationUsers(orgId);
  return NextResponse.json({ data: users });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const invited = await inviteUser(orgId, body, user.id);
  return NextResponse.json({ data: invited }, { status: 201 });
});
