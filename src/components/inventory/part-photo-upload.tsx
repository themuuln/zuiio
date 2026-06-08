"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface PartPhotoUploadProps {
  orgId: string;
  partId?: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB pre-compression limit
const MAX_DIMENSION = 1200; // max width/height in pixels
const JPEG_QUALITY = 0.8; // 80% quality — good balance

async function compressImage(file: File): Promise<Blob> {
  // Load image into an HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load image"));
    el.src = URL.createObjectURL(file);
  });

  let { width, height } = img;

  // Scale down if exceeds max dimension
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw onto canvas and export as JPEG
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up object URL
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
}: PartPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast.error("Зураг 5MB-аас бага байх ёстой");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Зөвхөн JPEG, PNG, WebP, HEIC зураг ашиглах боломжтой");
      return;
    }

    setUploading(true);
    try {
      // Compress image before upload
      const originalSize = file.size;
      const compressed = await compressImage(file);
      const saved = Math.round((1 - compressed.size / originalSize) * 100);

      const supabase = createClient();
      const uniqueName = `${crypto.randomUUID()}.jpg`;
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!imageUrl) return;
    setUploading(true);
    try {
      // Extract storage path from the public URL
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
      {/* Preview */}
      <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
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
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Buttons */}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="w-full"
        >
          {isBusy ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <span className="mr-1.5 text-xs">📁</span>
          )}
          {isBusy ? "Ачаалж байна..." : "Файлаас сонгох"}
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
    </div>
  );
}
