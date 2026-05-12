import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { createOrganization, getUserOrganization } from "@/lib/services/organization-service";

export const GET = createSimpleRouteHandler(async ({ user }) => {
  const org = await getUserOrganization(user.id);
  return NextResponse.json({ data: org });
});

export const POST = createSimpleRouteHandler(async ({ request, user }) => {
  const body = await request.json();
  const { name, slug } = body;
  const org = await createOrganization({ name, slug }, user.id);
  return NextResponse.json({ data: org }, { status: 201 });
});
