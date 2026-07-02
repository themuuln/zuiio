import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { receiveTransfer } from "@/lib/services/transfer-service";

export const POST = createRouteHandler(
  async ({ params, orgId, user, supabase }) => {
    const { transferId } = params as { transferId: string };
    const transfer = await receiveTransfer(
      supabase,
      transferId,
      orgId,
      user.id,
    );
    return NextResponse.json({ data: transfer });
  },
  { requiredPermission: { resource: "inventory", action: "update" } },
);
