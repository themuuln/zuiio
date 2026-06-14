import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { supplierId } = params;
  const supplier = await getSupplier(supabase, supplierId, orgId);
  return NextResponse.json({ data: supplier });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { supplierId } = params;
    const body = await request.json();
    const supplier = await updateSupplier(supabase, supplierId, orgId, body);
    return NextResponse.json({ data: supplier });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { supplierId } = params;
    await deleteSupplier(supabase, supplierId, orgId);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
