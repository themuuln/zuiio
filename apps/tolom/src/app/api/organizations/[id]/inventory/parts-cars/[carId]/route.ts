import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deletePartsCar,
  getPartsCar,
  updatePartsCar,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const car = await getPartsCar(supabase, orgId, params.carId);
  return NextResponse.json({ data: car });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const body = await request.json();
    const car = await updatePartsCar(supabase, orgId, params.carId, body);
    return NextResponse.json({ data: car });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    await deletePartsCar(supabase, orgId, params.carId);
    return NextResponse.json({ data: null }, { status: 204 });
  },
  { rateLimit: true, subscription: true },
);
