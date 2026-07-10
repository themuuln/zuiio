"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateAttachment } from "@/lib/queries/use-work-order-attachments";
import { reportServerError } from "@/lib/sentry-report-server";

interface WorkOrderPhotoUploadProps {
  orgId: string;
  workOrderId: string;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function WorkOrderPhotoUpload({
  orgId,
  workOrderId,
}: WorkOrderPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const createAttachment = useCreateAttachment(orgId, workOrderId);
  const t = useTranslations("workOrderDetail");

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) {
        toast.error(t("fileTooLarge"));
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("invalidFileType"));
        return;
      }

      setUploading(true);
      try {
        // 1. Upload to Supabase Storage via server proxy
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "metadata",
          JSON.stringify({
            orgId,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            entityType: "work-orders",
            entityId: workOrderId,
          }),
        );

        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Failed to upload");
        }
        const { data } = await res.json();

        // 2. Create attachment record with public URL
        const fileType = file.type === "application/pdf" ? "document" : "photo";
        await createAttachment.mutateAsync({
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: data.url,
          file_type: fileType,
        });
      } catch (err) {
        reportServerError("Unexpected error", err);
        toast.error(err instanceof Error ? err.message : t("uploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    [orgId, workOrderId, createAttachment, t],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: uploading || createAttachment.isPending,
    noClick: true,
    noKeyboard: true,
  });

  const isBusy = uploading || createAttachment.isPending;

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        className={isDragActive ? "border-primary bg-primary/10" : ""}
      >
        {isBusy ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Paperclip className="mr-1.5 size-3.5" />
        )}
        {isBusy ? t("uploading") : t("addPhoto")}
      </Button>
    </div>
  );
}
