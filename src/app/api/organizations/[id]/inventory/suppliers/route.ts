import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/services/supplier-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const suppliers = await getSuppliers(supabase, orgId);
    return NextResponse.json({ data: suppliers });
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const supplier = await createSupplier(supabase, orgId, body, user.id);
    return NextResponse.json({ data: supplier }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
    if (!itemId) {
      return NextResponse.json(
        { error: { message: "supplierId required" } },
        { status: 400 },
      );
    }
    const body = await request.json();
    const supplier = await updateSupplier(supabase, itemId, orgId, body);
    return NextResponse.json({ data: supplier });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
    if (!itemId) {
      return NextResponse.json(
        { error: { message: "supplierId required" } },
        { status: 400 },
      );
    }
    await deleteSupplier(supabase, itemId, orgId);
    return NextResponse.json({ data: { success: true } });
  },
  { rateLimit: true, subscription: true },
);
