import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createTransfer, getTransfers } from "@/lib/services/transfer-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const branchId = searchParams.get("branch_id") ?? undefined;
  const page = Number(searchParams.get("page")) || undefined;
  const pageSize = Number(searchParams.get("page_size")) || undefined;

  const result = await getTransfers(supabase, orgId, {
    status,
    branchId,
    page,
    pageSize,
  });
  return NextResponse.json({ data: result });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    await requireActiveSubscription(orgId);
    const body = await request.json();
    const transfer = await createTransfer(supabase, orgId, body, user.id);
    return NextResponse.json({ data: transfer }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
