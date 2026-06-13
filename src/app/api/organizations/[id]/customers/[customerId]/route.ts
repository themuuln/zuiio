import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/services/customer-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getCustomerVehicles,
  getCustomerWorkOrders,
} from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ supabase, orgId, params }) => {
  const { customerId } = params;
  const [customer, vehicles, workOrders] = await Promise.all([
    getCustomer(supabase, customerId, orgId),
    getCustomerVehicles(supabase, orgId, customerId),
    getCustomerWorkOrders(supabase, orgId, customerId),
  ]);
  return NextResponse.json({
    data: { ...customer, vehicles, work_orders: workOrders },
  });
});

export const PATCH = createRouteHandler(
  async ({ request, supabase, orgId, params, user }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await mutationRateLimiter.check(ip);
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
    const { customerId } = params;
    const body = await request.json();
    const customer = await updateCustomer(
      supabase,
      customerId,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: customer });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, supabase, orgId, params, user }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await mutationRateLimiter.check(ip);
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
    const { customerId } = params;
    await deleteCustomer(supabase, customerId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
);
