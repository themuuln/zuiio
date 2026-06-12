import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createVehicleModel,
  getDistinctMakes,
  getVehicleModels,
} from "@/lib/services/vehicle-models-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const make = request.nextUrl.searchParams.get("make") ?? undefined;
  const mode = request.nextUrl.searchParams.get("mode");

  if (mode === "makes") {
    const makes = await getDistinctMakes(supabase, orgId);
    return NextResponse.json({ data: makes });
  }

  const models = make
    ? (await getVehicleModels(supabase, orgId)).filter(
        (m) => m.make.toLowerCase() === make.toLowerCase(),
      )
    : await getVehicleModels(supabase, orgId);
  return NextResponse.json({ data: models });
});

export const POST = createRouteHandler(async ({ request, orgId, supabase }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }
  const body = await request.json();
  const model = await createVehicleModel(supabase, orgId, body);
  return NextResponse.json({ data: model }, { status: 201 });
});
