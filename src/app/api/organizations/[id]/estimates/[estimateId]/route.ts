import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteEstimate,
  getEstimate,
  updateEstimate,
} from "@/lib/services/estimate-service";

export const GET = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const estimate = await getEstimate(supabase, params.estimateId, orgId);
    if (!estimate) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Estimate not found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: estimate });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const body = await request.json();
    const estimate = await updateEstimate(
      supabase,
      params.estimateId,
      orgId,
      body,
    );
    return NextResponse.json({ data: estimate });
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    await deleteEstimate(supabase, params.estimateId, orgId);
    return NextResponse.json({ data: null });
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "work_orders", action: "delete" },
  },
);
