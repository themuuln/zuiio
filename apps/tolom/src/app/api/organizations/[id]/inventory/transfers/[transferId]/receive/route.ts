import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { receiveTransfer } from "@/lib/services/transfer-service";

export { dynamic } from "@/lib/api-handler";

export const POST = createRouteHandler(
  async ({ params, orgId, user, supabase }) => {
    const { transferId } = params as { transferId: string };
    const transfer = await receiveTransfer(
      supabase,
      transferId,
      orgId,
      user.id,
    );
    return ok(transfer);
  },
  { requiredPermission: { resource: "inventory", action: "update" } },
);
