import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteVehicle,
  getVehicle,
  getVehicleServiceHistory,
  updateVehicle,
} from "@/lib/services/vehicle-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { vehicleId } = params;
  const vehicle = await getVehicle(vehicleId, orgId);
  const serviceHistory = await getVehicleServiceHistory(orgId, vehicleId);
  return NextResponse.json({ data: { ...vehicle, service_history: serviceHistory } });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { vehicleId } = params;
  const body = await request.json();
  const vehicle = await updateVehicle(vehicleId, orgId, body, user.id);
  return NextResponse.json({ data: vehicle });
});

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { vehicleId } = params;
  await deleteVehicle(vehicleId, orgId, user.id);
  return NextResponse.json({ data: null });
});
