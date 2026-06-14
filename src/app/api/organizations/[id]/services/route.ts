import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createService,
  getServices,
} from "@/lib/services/service-catalog-service";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const services = await getServices(supabase, orgId, category);
    return NextResponse.json({ data: services });
  },
  { requiredPermission: { resource: "services", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const service = await createService(supabase, orgId, body);
    return NextResponse.json({ data: service }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "services", action: "create" },
  },
);
