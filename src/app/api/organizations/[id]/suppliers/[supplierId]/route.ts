import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { supplierId } = params;
  const supplier = await getSupplier(supplierId, orgId);
  return NextResponse.json({ data: supplier });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  const { supplierId } = params;
  const body = await request.json();
  const supplier = await updateSupplier(supplierId, orgId, body);
  return NextResponse.json({ data: supplier });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  const { supplierId } = params;
  await deleteSupplier(supplierId, orgId);
  return NextResponse.json({ data: null });
});
