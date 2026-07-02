import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPartsCar,
  getPartsCars,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const cars = await getPartsCars(supabase, orgId);
  return NextResponse.json({ data: cars });
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const car = await createPartsCar(supabase, orgId, user.id, body);
    return NextResponse.json({ data: car }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
