import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteVehicle,
  getVehicle,
  getVehicleServiceHistory,
  updateVehicle,
} from "@/lib/services/vehicle-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { vehicleId } = params;
  const [vehicle, serviceHistory] = await Promise.all([
    getVehicle(vehicleId, orgId),
    getVehicleServiceHistory(orgId, vehicleId),
  ]);
  return NextResponse.json({ data: { ...vehicle, service_history: serviceHistory } });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { vehicleId } = params;
  const body = await request.json();
  const vehicle = await updateVehicle(vehicleId, orgId, body, user.id);
  return NextResponse.json({ data: vehicle });
});

export const DELETE = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { vehicleId } = params;
  await deleteVehicle(vehicleId, orgId, user.id);
  return NextResponse.json({ data: null });
});
