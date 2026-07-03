"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@zuiio/core";
import { useCreateAttachment } from "@/lib/queries/use-work-order-attachments";
import { createClient } from "@/lib/supabase/client";

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

  async function uploadFile(file: File) {
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
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const uniqueName = `${generateUUID()}.${ext}`;
      const storagePath = `${orgId}/${workOrderId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("work-order-photos")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("work-order-photos")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      const fileType = file.type === "application/pdf" ? "document" : "photo";

      await createAttachment.mutateAsync({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        file_type: fileType,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

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
