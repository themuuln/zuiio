import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { removePartsCarPart } from "@/lib/services/parts-cars-service";

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    await removePartsCarPart(supabase, orgId, params.carId, params.partId);
    return NextResponse.json({ data: null }, { status: 204 });
  },
  { rateLimit: true, subscription: true },
);
