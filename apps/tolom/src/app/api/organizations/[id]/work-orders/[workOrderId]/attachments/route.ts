import { apiError, created, createRouteHandler, ok } from "@/lib/api-response";
import {
  createAttachment,
  deleteAttachment,
  getAttachments,
} from "@/lib/services/attachment-service";
import {

  createAttachmentSchema,
  parseBody,
} from "@/lib/validation/work-orders";
export const GET = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { workOrderId } = params;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        workOrderId,
      )
    ) {
      return apiError("VALIDATION_ERROR", "Invalid work order ID", 400);
    }
    const attachments = await getAttachments(supabase, orgId, workOrderId);
    // Storage URLs are now public — no resolution needed
    return ok(attachments);
  },
  {
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "read" },
  },
);

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const body = await parseBody(request, createAttachmentSchema);
    const attachment = await createAttachment(
      supabase,
      orgId,
      workOrderId,
      body,
    );
    return created(attachment);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");
    if (!attachmentId) {
      return apiError(
        "VALIDATION_ERROR",
        "attachmentId query param required",
        400,
      );
    }
    await deleteAttachment(supabase, orgId, workOrderId, attachmentId);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);
