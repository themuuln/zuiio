import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteService,
  getService,
  updateService,
} from "@/lib/services/service-catalog-service";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { serviceId } = params;
  const service = await getService(supabase, serviceId);
  return NextResponse.json({ data: service });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    const body = await request.json();
    const service = await updateService(supabase, serviceId, orgId, body);
    return NextResponse.json({ data: service });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    await deleteService(supabase, serviceId, orgId);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
