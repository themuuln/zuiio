import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { cancelRefund } from "@/lib/services/refund-service";

export const PATCH = createRouteHandler(
  async ({ orgId, params }) => {
    const { refundId } = params;
    const refund = await cancelRefund(refundId, orgId);
    return NextResponse.json({ data: refund });
  },
  { requiredPermission: { resource: "refunds", action: "update" } },
);
