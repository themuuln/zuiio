import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createSupplier, getSuppliers } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const suppliers = await getSuppliers(supabase, orgId);
  return NextResponse.json({ data: suppliers });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const supplier = await createSupplier(supabase, orgId, body, user.id);
    return NextResponse.json({ data: supplier }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);
