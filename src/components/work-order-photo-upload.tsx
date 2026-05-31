"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const createAttachment = useCreateAttachment(orgId, workOrderId);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast.error("File must be under 10MB");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Only JPEG, PNG, WebP, HEIC images and PDF files are allowed",
      );
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const uniqueName = `${crypto.randomUUID()}.${ext}`;
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
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isBusy = uploading || createAttachment.isPending;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
      >
        {isBusy ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Paperclip className="mr-1.5 size-3.5" />
        )}
        {isBusy ? "Uploading..." : "Add Photo"}
      </Button>
    </div>
  );
}
