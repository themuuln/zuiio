import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  addServiceToWorkOrder,
  removeServiceFromWorkOrder,
  updateWorkOrderServicePrice,
} from "@/lib/services/work-order-items-service";
import {
  addWorkOrderServiceSchema,
  parseBody,
  updateServicePriceSchema,
} from "@/lib/validation/work-orders";

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
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
    const { workOrderId } = params;
    const body = await parseBody(request, addWorkOrderServiceSchema);
    const service = await addServiceToWorkOrder(
      supabase,
      workOrderId,
      orgId,
      body,
    );
    return NextResponse.json({ data: service }, { status: 201 });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
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
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const body = await parseBody(request, updateServicePriceSchema);

    if (!serviceId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "serviceId query param required",
          },
        },
        { status: 400 },
      );
    }

    const updateParams: { final_price?: number; quantity?: number } = {};
    if (body.final_price !== undefined)
      updateParams.final_price = body.final_price;
    if (body.quantity !== undefined) updateParams.quantity = body.quantity;

    if (Object.keys(updateParams).length > 0) {
      await updateWorkOrderServicePrice(
        supabase,
        serviceId,
        workOrderId,
        updateParams,
        orgId,
      );
    }

    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
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
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "serviceId query param required",
          },
        },
        { status: 400 },
      );
    }

    await removeServiceFromWorkOrder(supabase, serviceId, workOrderId, orgId);
    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);
