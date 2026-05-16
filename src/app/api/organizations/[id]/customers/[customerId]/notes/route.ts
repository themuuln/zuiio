import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createCustomerNote,
  getCustomerNotes,
} from "@/lib/services/customer-note-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { customerId } = params;
  const notes = await getCustomerNotes(orgId, customerId);
  return NextResponse.json({ data: notes });
});

export const POST = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { customerId } = params;
  const body = await request.json();
  const note = await createCustomerNote(orgId, customerId, body, user.id);
  return NextResponse.json({ data: note }, { status: 201 });
});
