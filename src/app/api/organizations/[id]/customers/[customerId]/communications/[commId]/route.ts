import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { deleteCustomerCommunication } from "@/lib/services/communication-service";

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { customerId, commId } = params;
    await deleteCustomerCommunication(
      supabase,
      orgId,
      customerId,
      commId,
      user.id,
    );
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
