import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createInvite } from "@/lib/services/invite-service";
import { getOrganizationUsers, removeUser } from "@/lib/services/user-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const users = await getOrganizationUsers(supabase, orgId);
  return NextResponse.json({ data: users });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const invite = await createInvite(supabase, orgId, body, user.id);
    return NextResponse.json({ data: invite }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    await removeUser(supabase, body.userId, orgId);
    return NextResponse.json({ success: true });
  },
  { rateLimit: true, subscription: true },
);
