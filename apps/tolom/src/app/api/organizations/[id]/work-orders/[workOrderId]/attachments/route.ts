import { ok, created, apiError, createRouteHandler } from "@/lib/api-response"
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
    const data = await getAttachments(supabase, orgId, workOrderId);
    return ok(data);
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
      return apiError("VALIDATION_ERROR", "attachmentId query param required", 400);
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
