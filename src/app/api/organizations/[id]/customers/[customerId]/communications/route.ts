import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createCustomerCommunication,
  getCustomerCommunications,
} from "@/lib/services/communication-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { customerId } = params;
  const communications = await getCustomerCommunications(orgId, customerId);
  return NextResponse.json({ data: communications });
});

export const POST = createRouteHandler(
  async ({ request, orgId, params, user }) => {
    await requireActiveSubscription(orgId);
    const { customerId } = params;
    const body = await request.json();
    const communication = await createCustomerCommunication(
      orgId,
      customerId,
      body,
      user.id,
    );
    return NextResponse.json({ data: communication }, { status: 201 });
  },
);
