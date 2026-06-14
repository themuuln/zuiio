import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { publishPartsCarPartsToCatalog } from "@/lib/services/parts-cars-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, params, supabase }) => {
    const result = await publishPartsCarPartsToCatalog(
      supabase,
      orgId,
      user.id,
      params.carId,
    );
    return NextResponse.json({ data: result });
  },
  { rateLimit: true, subscription: true },
);
