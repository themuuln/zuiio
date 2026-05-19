import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createVehicleModel, getVehicleModels } from "@/lib/services/vehicle-models-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const models = await getVehicleModels(orgId);
  return NextResponse.json({ data: models });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const body = await request.json();
  const model = await createVehicleModel(orgId, body);
  return NextResponse.json({ data: model }, { status: 201 });
});
