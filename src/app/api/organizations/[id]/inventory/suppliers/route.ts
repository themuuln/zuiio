import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const suppliers = await getSuppliers(orgId);
  return NextResponse.json({ data: suppliers });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const supplier = await createSupplier(orgId, body, user.id);
  return NextResponse.json({ data: supplier }, { status: 201 });
});

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const itemId =
    searchParams.get("supplierId") ?? searchParams.get("id");
  if (!itemId) {
    return NextResponse.json(
      { error: { message: "supplierId required" } },
      { status: 400 },
    );
  }
  const body = await request.json();
  const supplier = await updateSupplier(itemId, orgId, body);
  return NextResponse.json({ data: supplier });
});

export const DELETE = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const itemId =
    searchParams.get("supplierId") ?? searchParams.get("id");
  if (!itemId) {
    return NextResponse.json(
      { error: { message: "supplierId required" } },
      { status: 400 },
    );
  }
  await deleteSupplier(itemId, orgId);
  return NextResponse.json({ data: { success: true } });
});
