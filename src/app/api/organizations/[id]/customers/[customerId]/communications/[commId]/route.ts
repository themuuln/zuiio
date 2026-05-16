import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { deleteCustomerCommunication } from "@/lib/services/communication-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { customerId, commId } = params;
  await deleteCustomerCommunication(orgId, customerId, commId, user.id);
  return NextResponse.json({ data: null });
});
