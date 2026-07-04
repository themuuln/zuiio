import { ok, created, createRouteHandler } from "@/lib/api-response"
import {
  createCustomerNote,
  getCustomerNotes,
} from "@/lib/services/customer-note-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const notes = await getCustomerNotes(supabase, orgId, customerId);
  return ok(notes);
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
    return created(note);
  },
  { rateLimit: true, subscription: true },
);
