import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/services/customer-service";
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
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, supabase, orgId, params, user }) => {
    const { customerId } = params;
    await deleteCustomer(supabase, customerId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
