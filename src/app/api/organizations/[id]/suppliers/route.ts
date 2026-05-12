import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getSuppliers, createSupplier } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const suppliers = await getSuppliers(orgId);
  return NextResponse.json({ data: suppliers });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const supplier = await createSupplier(orgId, body, user.id);
  return NextResponse.json({ data: supplier }, { status: 201 });
});
