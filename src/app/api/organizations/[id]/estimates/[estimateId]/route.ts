import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getEstimate,
  updateEstimate,
  deleteEstimate,
} from "@/lib/services/estimate-service";

export const GET = createRouteHandler(
  async ({ params }) => {
    const estimate = await getEstimate(params.estimateId);
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
  async ({ request, params, orgId }) => {
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
    const estimate = await updateEstimate(params.estimateId, orgId, body);
    return NextResponse.json({ data: estimate });
  },
  {
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId }) => {
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
    await deleteEstimate(params.estimateId, orgId);
    return NextResponse.json({ data: null });
  },
  {
    requiredPermission: { resource: "work_orders", action: "delete" },
  },
);
