import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteVehicleModel,
  updateVehicleModel,
} from "@/lib/services/vehicle-models-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { modelId } = params;
    const body = await request.json();
    const model = await updateVehicleModel(supabase, modelId, orgId, body);
    return NextResponse.json({ data: model });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { modelId } = params;
    await deleteVehicleModel(supabase, modelId, orgId);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
