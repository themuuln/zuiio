import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/services/customer-service";
import { getCustomerVehicles } from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { customerId } = params;
  const customer = await getCustomer(customerId, orgId);
  const vehicles = await getCustomerVehicles(orgId, customerId);
  return NextResponse.json({ data: { ...customer, vehicles } });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  const { customerId } = params;
  const body = await request.json();
  const customer = await updateCustomer(customerId, orgId, body, user.id);
  return NextResponse.json({ data: customer });
});

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  const { customerId } = params;
  await deleteCustomer(customerId, orgId, user.id);
  return NextResponse.json({ data: null });
});
