import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getStockThresholds,
  setStockThreshold,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const thresholds = await getStockThresholds(supabase, orgId, branchId);
  return NextResponse.json({ data: thresholds });
});

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const threshold = await setStockThreshold(supabase, orgId, body);
    return NextResponse.json({ data: threshold }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
