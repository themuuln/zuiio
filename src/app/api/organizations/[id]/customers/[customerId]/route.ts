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

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { customerId } = params;
  const [customer, vehicles, workOrders] = await Promise.all([
    getCustomer(customerId, orgId),
    getCustomerVehicles(orgId, customerId),
    getCustomerWorkOrders(orgId, customerId),
  ]);
  return NextResponse.json({
    data: { ...customer, vehicles, work_orders: workOrders },
  });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user }) => {
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
    const { customerId } = params;
    const body = await request.json();
    const customer = await updateCustomer(customerId, orgId, body, user.id);
    return NextResponse.json({ data: customer });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user }) => {
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
    const { customerId } = params;
    await deleteCustomer(customerId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
);
