import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createVehicle, getVehicles, searchByPlate } from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const search =
    request.nextUrl.searchParams.get("q") ??
    request.nextUrl.searchParams.get("plate") ??
    undefined;
  const customerId = request.nextUrl.searchParams.get("customer") ?? undefined;

  const vehicles = search
    ? await searchByPlate(orgId, search)
    : await getVehicles(orgId, { customerId });

  return NextResponse.json({ data: vehicles });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const vehicle = await createVehicle(orgId, body, user.id);
  return NextResponse.json({ data: vehicle }, { status: 201 });
});
