import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { deleteCustomerNote } from "@/lib/services/customer-note-service";

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { customerId, noteId } = params;
  await deleteCustomerNote(orgId, customerId, noteId, user.id);
  return NextResponse.json({ data: null });
});
