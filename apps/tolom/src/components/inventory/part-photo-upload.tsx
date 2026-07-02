"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/crypto-utils";
import { createClient } from "@/lib/supabase/client";

interface PartPhotoUploadProps {
  orgId: string;
  partId?: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  readOnly?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

async function compressImage(file: File): Promise<Blob> {
  let processedFile = file;
  if (file.type === "image/heic") {
    // Dynamic import to avoid SSR breakage (heic2any references window at module level)
    const heic2any = (await import("heic2any")).default;
    const jpegBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: JPEG_QUALITY,
    });
    processedFile = new File(
      [jpegBlob as Blob],
      file.name.replace(/\.heic$/i, ".jpg"),
      { type: "image/jpeg" },
    );
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load image"));
    el.src = URL.createObjectURL(processedFile);
  });

  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to compress image"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

export default function PartPhotoUpload({
  orgId,
  partId,
  imageUrl,
  onImageChange,
  readOnly = false,
}: PartPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Зөвхөн JPEG, PNG, WebP, HEIC зураг ашиглах боломжтой");
      return;
    }

    setUploading(true);
    try {
      const originalSize = file.size;
      const compressed = await compressImage(file);
      const saved = Math.round((1 - compressed.size / originalSize) * 100);

      const supabase = createClient();
      const uniqueName = `${generateUUID()}.jpg`;
      const storagePath = `${orgId}/${partId ?? "new"}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("part-photos")
        .upload(storagePath, compressed, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("part-photos")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      onImageChange(urlData.publicUrl);
      toast.dismiss();
      const sizeKb = Math.round(compressed.size / 1024);
      toast.success(
        saved > 5
          ? `Зураг нэмэгдлээ (${sizeKb}KB, ${saved}% хэмнэлттэй)`
          : "Зураг амжилттай нэмэгдлээ",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
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
    },
    maxFiles: 1,
    disabled: uploading || readOnly,
    noClick: true,
    noKeyboard: true,
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleRemove() {
    if (!imageUrl) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const urlParts = imageUrl.split("/part-photos/");
      if (urlParts[1]) {
        await supabase.storage.from("part-photos").remove([urlParts[1]]);
      }
      onImageChange(null);
      toast.dismiss();
      toast.success("Зураг устгагдлаа");
    } catch {
      toast.error("Зураг устгахад алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  }

  const isBusy = uploading;

  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone area wrapping the preview + inputs */}
      <div
        {...getRootProps()}
        className={`relative flex size-24 items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-muted"
        } ${!readOnly && !isBusy ? "cursor-pointer" : "cursor-default"}`}
      >
        <input {...getInputProps()} />
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Part photo"
            width={96}
            height={96}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <Camera className="size-8 text-muted-foreground/40" />
        )}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 text-xs font-medium text-primary">
            Drop image
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Camera capture input (kept separate, no drag-drop) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Buttons (hidden in readOnly mode) */}
      {!readOnly && (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isBusy}
            className="w-full"
          >
            <Camera className="mr-1.5 size-3.5" />
            {isBusy ? "Ачаалж байна..." : "Зураг авах"}
          </Button>
          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isBusy}
              className="w-full text-muted-foreground"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Устгах
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
