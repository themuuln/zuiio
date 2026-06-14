import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { deleteCustomerNote } from "@/lib/services/customer-note-service";

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { customerId, noteId } = params;
    await deleteCustomerNote(supabase, orgId, customerId, noteId, user.id);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
