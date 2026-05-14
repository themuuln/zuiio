import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createCustomer, getCustomers, searchCustomers } from "@/lib/services/customer-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const searchQuery = request.nextUrl.searchParams.get("q") ?? undefined;
  const customers = searchQuery
    ? await searchCustomers(orgId, searchQuery)
    : await getCustomers(orgId);
  return NextResponse.json({ data: customers });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const customer = await createCustomer(orgId, body, user.id);
  return NextResponse.json({ data: customer }, { status: 201 });
});
