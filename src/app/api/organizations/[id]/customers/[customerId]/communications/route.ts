import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createCustomerCommunication,
  getCustomerCommunications,
} from "@/lib/services/communication-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const communications = await getCustomerCommunications(
    supabase,
    orgId,
    customerId,
  );
  return NextResponse.json({ data: communications });
});

export const POST = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { customerId } = params;
    const body = await request.json();
    const communication = await createCustomerCommunication(
      supabase,
      orgId,
      customerId,
      body,
      user.id,
    );
    return NextResponse.json({ data: communication }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);
