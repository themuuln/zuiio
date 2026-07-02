import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { approveTransfer } from "@/lib/services/transfer-service";

export const POST = createRouteHandler(
  async ({ params, orgId, user, supabase }) => {
    const { transferId } = params as { transferId: string };
    const transfer = await approveTransfer(
      supabase,
      transferId,
      orgId,
      user.id,
    );
    return NextResponse.json({ data: transfer });
  },
  { requiredPermission: { resource: "inventory", action: "update" } },
);
