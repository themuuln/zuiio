import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createCustomerNote,
  getCustomerNotes,
} from "@/lib/services/customer-note-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const notes = await getCustomerNotes(supabase, orgId, customerId);
  return NextResponse.json({ data: notes });
});

export const POST = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { customerId } = params;
    const body = await request.json();
    const note = await createCustomerNote(
      supabase,
      orgId,
      customerId,
      body,
      user.id,
    );
    return NextResponse.json({ data: note }, { status: 201 });
  },
  { rateLimit: true, subscription: true },
);
