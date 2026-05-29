import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { createOrgQuery } from "./factory";
import type { WorkOrderAttachment } from "@/lib/types";
import { attachmentKeys } from "./keys";

export function useAttachments(orgId: string | undefined, woId: string) {
  const fetchAttachments = createOrgQuery<WorkOrderAttachment[]>(
    `/work-orders/${woId}/attachments`,
  );
  return useQuery({
    queryKey: attachmentKeys.list(orgId ?? "", woId),
    queryFn: () => fetchAttachments(orgId!),
    enabled: !!orgId && !!woId,
    staleTime: 15_000,
  });
}

export function useCreateAttachment(orgId: string | undefined, woId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: {
      file_name: string;
      file_size: number;
      mime_type: string;
      storage_path: string;
      public_url?: string;
      file_type: "photo" | "document" | "other";
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/attachments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as WorkOrderAttachment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(orgId ?? "", woId),
      });
      toast.success("Photo uploaded");
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useDeleteAttachment(orgId: string | undefined, woId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(orgId ?? "", woId),
      });
      toast.success("Photo removed");
    },
    onError: (err: Error, attachmentId) => {
      toastRetry(err.message, () => mutation.mutateAsync(attachmentId));
    },
  });
  return mutation;
}
