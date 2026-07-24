import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { createFollowup, listFollowups } from "@/lib/services/followup-service";
/**
 * GET /api/organizations/[id]/followups
 * List follow-ups with optional filters.
 */
export const GET = createRouteHandler(
  async ({ request, supabase, orgId }) => {
    const { searchParams } = new URL(request.url);

    const result = await listFollowups(supabase, orgId, {
      customerId: searchParams.get("customerId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      assignedTo: searchParams.get("assignedTo") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    });

    return NextResponse.json(result);
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

/**
 * POST /api/organizations/[id]/followups
 * Create a follow-up.
 */
export const POST = createRouteHandler(
  async ({ request, supabase, orgId }) => {
    const body = await request.json();

    const followup = await createFollowup(supabase, orgId, {
      customer_id: body.customer_id,
      vehicle_id: body.vehicle_id,
      work_order_id: body.work_order_id,
      estimate_id: body.estimate_id,
      invoice_id: body.invoice_id,
      type: body.type,
      subject: body.subject,
      notes: body.notes,
      due_at: body.due_at,
      assigned_to: body.assigned_to,
      created_by: body.created_by,
    });

    return ok(followup);
  },
  { requiredPermission: { resource: "customers", action: "update" } },
);
