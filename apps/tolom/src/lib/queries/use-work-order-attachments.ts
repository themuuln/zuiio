import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { WorkOrderAttachment } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { attachmentKeys } from "./keys";

export function useAttachments(orgId: string | undefined, woId: string) {
  const fetchAttachments = createOrgQuery<WorkOrderAttachment[]>(
    `/work-orders/${woId}/attachments`,
  );
  return useQuery({
    queryKey: attachmentKeys.list(orgId ?? "", woId),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchAttachments(orgId);
    },
    enabled: !!orgId && !!woId,
    staleTime: 15_000,
  });
}

export function useCreateAttachment(orgId: string | undefined, woId: string) {
  return useOrgMutation<
    WorkOrderAttachment,
    {
      file_name: string;
      file_size: number;
      mime_type: string;
      storage_path: string;
      public_url?: string;
      file_type: "photo" | "document" | "other";
    }
  >({
    endpoint: `/api/organizations/${orgId}/work-orders/${woId}/attachments`,
    method: "POST",
    queryKey: attachmentKeys.list(orgId ?? "", woId),
    successMessage: "Photo uploaded",
  });
}

export function useDeleteAttachment(orgId: string | undefined, woId: string) {
  return useOrgMutation<unknown, string>({
    endpoint: (attachmentId) =>
      `/api/organizations/${orgId}/work-orders/${woId}/attachments?attachmentId=${attachmentId}`,
    method: "DELETE",
    queryKey: attachmentKeys.list(orgId ?? "", woId),
    successMessage: "Photo removed",
  });
}
