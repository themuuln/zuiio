import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import type { WorkOrderAttachment } from "@/lib/types";
import { createCrudService } from "./create-crud-service";

// ── Types ──────────────────────────────────────────────────────

export interface CreateAttachmentParams {
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  public_url?: string | null;
  file_type: "photo" | "document" | "other";
}

// ── Factory-backed CRUD ───────────────────────────────────────

const crud = createCrudService<
  WorkOrderAttachment,
  CreateAttachmentParams,
  Record<string, never>
>({
  tableName: "work_order_attachments",
  selectColumns:
    "id, organization_id, work_order_id, file_name, file_size, mime_type, storage_path, public_url, file_type, uploaded_by, created_at, deleted_at",
  cacheTagKey: () => "work-order-attachments",
  orderBy: { column: "created_at", direction: "desc" },
  hooks: {
    onQuery: (query, options) => {
      if (options?.workOrderId) {
        return query.eq("work_order_id", options.workOrderId);
      }
      return query;
    },
    afterCreate: async (result) => {
      const attachment = result as unknown as { work_order_id: string };
      if (attachment.work_order_id) {
        revalidateTag(
          cacheTags.workOrderAttachments(attachment.work_order_id),
          "max",
        );
      }
    },
    beforeCreate: async (params) => {
      return {
        public_url: params.public_url ?? null,
      } as Partial<CreateAttachmentParams>;
    },
  },
});

// ── Backward-compatible wrappers ──────────────────────────────

export async function getAttachments(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
): Promise<WorkOrderAttachment[]> {
  const result = await crud.getAll(db, orgId, { workOrderId, pageSize: 1000 });
  return result.data;
}

export async function createAttachment(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  params: CreateAttachmentParams,
): Promise<WorkOrderAttachment> {
  const userId = (await db.auth.getUser()).data.user?.id;
  const result = await crud.create(
    db,
    orgId,
    { ...params, work_order_id: workOrderId } as CreateAttachmentParams,
    userId ?? "",
  );
  revalidateTag(cacheTags.workOrderAttachments(workOrderId), "max");
  return result;
}

export async function deleteAttachment(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  attachmentId: string,
): Promise<void> {
  const userId = (await db.auth.getUser()).data.user?.id;
  await crud.softDelete(db, orgId, attachmentId, userId ?? "");
  revalidateTag(cacheTags.workOrderAttachments(workOrderId), "max");
}
