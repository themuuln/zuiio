import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getTransfer } from "@/lib/services/transfer-service";

export const GET = createRouteHandler(async ({ params, orgId, supabase }) => {
  const { transferId } = params as { transferId: string };
  const transfer = await getTransfer(supabase, transferId, orgId);
  return NextResponse.json({ data: transfer });
});
