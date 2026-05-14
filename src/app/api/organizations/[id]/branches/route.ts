import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createBranch, getBranches } from "@/lib/services/branch-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const branches = await getBranches(orgId);
  return NextResponse.json({ data: branches });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const branch = await createBranch(orgId, body);
  return NextResponse.json({ data: branch }, { status: 201 });
});
