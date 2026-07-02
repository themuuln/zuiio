import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  addPartsCarPart,
  getPartsCarParts,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const parts = await getPartsCarParts(supabase, orgId, params.carId);
  return NextResponse.json({ data: parts });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, params, supabase }) => {
    const body = await request.json();
    const part = await addPartsCarPart(
      supabase,
      orgId,
      user.id,
      params.carId,
      body,
    );
    return NextResponse.json({ data: part }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);
