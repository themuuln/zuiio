import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createBranch, getBranches } from "@/lib/services/branch-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const branches = await getBranches(supabase, orgId);
    return NextResponse.json({ data: branches });
  },
  { requiredPermission: { resource: "branches", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const branch = await createBranch(supabase, orgId, body);
    return NextResponse.json({ data: branch }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "branches", action: "create" },
  },
);
