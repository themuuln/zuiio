import { revalidateTag } from "next/cache";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { WorkOrderAttachment } from "@/lib/types";
import { NotFoundError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getAttachments(
  orgId: string,
  workOrderId: string,
): Promise<WorkOrderAttachment[]> {
  const supabase = await createClient();

  return withCache(
    ["getWorkOrderAttachments", workOrderId],
    async () => {
      const { data, error } = await supabase
        .from("work_order_attachments")
        .select("id, organization_id, work_order_id, file_name, file_size, mime_type, storage_path, public_url, file_type, uploaded_by, created_at, deleted_at")
        .eq("organization_id", orgId)
        .eq("work_order_id", workOrderId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message ?? "Failed to fetch attachments");
      return (data ?? []) as WorkOrderAttachment[];
    },
    {
      tags: [cacheTags.workOrderAttachments(workOrderId)],
      revalidate: cacheDurations.workOrderDetail,
    },
  );
}

export interface CreateAttachmentParams {
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  public_url?: string;
  file_type: 'photo' | 'document' | 'other';
}

export async function createAttachment(
  orgId: string,
  workOrderId: string,
  params: CreateAttachmentParams,
): Promise<WorkOrderAttachment> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("work_order_attachments")
    .insert({
      organization_id: orgId,
      work_order_id: workOrderId,
      file_name: params.file_name,
      file_size: params.file_size,
      mime_type: params.mime_type,
      storage_path: params.storage_path,
      public_url: params.public_url ?? null,
      file_type: params.file_type,
      uploaded_by: userId,
    })
    .select("id, organization_id, work_order_id, file_name, file_size, mime_type, storage_path, public_url, file_type, uploaded_by, created_at, deleted_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create attachment");

  revalidateTag(cacheTags.workOrderAttachments(workOrderId), "max");

  return data as unknown as WorkOrderAttachment;
}

export async function deleteAttachment(
  orgId: string,
  workOrderId: string,
  attachmentId: string,
): Promise<void> {
  const supabase = await createClient();
  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("work_order_attachments")
    .update({ deleted_at: deletedAt })
    .eq("id", attachmentId)
    .eq("organization_id", orgId)
    .eq("work_order_id", workOrderId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Attachment not found");

  revalidateTag(cacheTags.workOrderAttachments(workOrderId), "max");
}
