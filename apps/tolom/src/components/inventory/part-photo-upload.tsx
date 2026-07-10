"use client";

import { Camera, Loader2, Pencil, Trash2 } from "lucide-react";
import { reportServerError } from "@/lib/sentry-report-server";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  // Dynamic import: heic2any accesses `window` at module scope —
  // cannot be statically imported even in a "use client" component.
  if (file.type === "image/heic") {
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

  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const el = new window.Image();
  el.onload = () => resolve(el);
  el.onerror = () => reject(new Error("Failed to load image"));
  el.src = URL.createObjectURL(processedFile);
  const img = await promise;

  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  const { promise: blobPromise, resolve: blobResolve, reject: blobReject } =
    Promise.withResolvers<Blob>();
  canvas.toBlob(
    (blob) => (blob ? blobResolve(blob) : blobReject(new Error("Canvas toBlob failed"))),
    "image/jpeg",
    JPEG_QUALITY,
  );
  return blobPromise;
}

export default function PartPhotoUpload({
  orgId,
  partId,
  imageUrl,
  onImageChange,
  readOnly = false,
}: PartPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(imageUrl);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync when parent passes a new URL (e.g. switching between parts)
  useEffect(() => {
    setDisplayUrl(imageUrl);
  }, [imageUrl]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Зөвхөн JPEG, PNG, WebP, HEIC зураг ашиглах боломжтой");
        return;
      }

      setUploading(true);
      try {
        const originalSize = file.size;
        const compressed = await compressImage(file);
        const saved = Math.round((1 - compressed.size / originalSize) * 100);

        const formData = new FormData();
        formData.append("file", compressed, "photo.jpg");
        formData.append(
          "metadata",
          JSON.stringify({
            orgId,
            fileName: file.name,
            mimeType: "image/jpeg",
            fileSize: compressed.size,
            entityType: "parts",
            entityId: partId ?? "new",
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

        // Store public URL for the database, use blob URL for instant preview
        onImageChange(data.url);
        setDisplayUrl(URL.createObjectURL(compressed));
        toast.dismiss();
        const sizeKb = Math.round(compressed.size / 1024);
        toast.success(
          saved > 5
            ? `Зураг нэмэгдлээ (${sizeKb}KB, ${saved}% хэмнэлттэй)`
            : "Зураг амжилттай нэмэгдлээ",
        );
      } catch (err) {
        reportServerError("Unexpected error", err);
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [orgId, partId, onImageChange],
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
    },
    maxFiles: 1,
    disabled: uploading || readOnly,
    noKeyboard: true,
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  async function handleRemove() {
    if (!imageUrl) return;
    setUploading(true);
    try {
      if (imageUrl && !imageUrl.startsWith("blob:")) {
        await fetch(
          `/api/storage/object?key=${encodeURIComponent(imageUrl)}`,
          { method: "DELETE" },
        );
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

  // ── ReadOnly: click to preview in a dialog ──
  if (readOnly) {
    if (!displayUrl) {
      return (
        <div className="flex size-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
          <Camera className="size-8 text-muted-foreground/40" aria-hidden="true" />
        </div>
      );
    }

    return (
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Зураг харах (дээр дарж нэмэлт мэдээлэл үзэх)"
            />
          }
        >
          <img
            src={displayUrl}
            alt="Сэлбэгийн зураг"
            className="size-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <span className="text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Харах
            </span>
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-lg p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">Сэлбэгийн зураг</DialogTitle>
          <img
            src={displayUrl}
            alt="Сэлбэгийн зураг — бүтэн хэмжээ"
            className="w-full rounded-lg object-contain"
            style={{ maxHeight: "70vh" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // ── Editable: click to upload, drag-and-drop, camera, remove ──
  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone area — clicking opens file picker */}
      <div
        {...getRootProps()}
        className={`group relative flex w-full max-w-[200px] aspect-square items-center justify-center overflow-hidden rounded-xl border-2 transition-all ${
          isDragActive
            ? "border-primary bg-primary/10 scale-[1.02]"
            : displayUrl
              ? "border-border bg-muted hover:border-primary/40"
              : "border-dashed border-border/60 bg-muted/50 hover:border-primary/40 hover:bg-muted"
        } ${!isBusy ? "cursor-pointer" : "cursor-default"}`}
        role="button"
        tabIndex={0}
        aria-label={displayUrl ? "Зураг солих — дарж шинэ зураг оруулна уу" : "Зураг нэмэх — дарж файл сонгоно уу"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input {...getInputProps()} />

        {/* Hidden file input for click-to-upload (used by keyboard handler too) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileSelect}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Сэлбэгийн зураг"
              className="size-full object-cover"
            />
            {/* Hover overlay */}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-colors group-hover:bg-black/40">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 transition-all group-hover:opacity-100">
                <Pencil className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Зураг солих
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
            <Camera className="size-7" aria-hidden="true" />
            <span className="text-[10px] leading-tight">Зураг нэмэх</span>
          </span>
        )}

        {/* Drag overlay */}
        {isDragActive && (
          <span className="absolute inset-0 flex items-center justify-center bg-primary/20 text-xs font-medium text-primary">
            Дарж оруулна уу
          </span>
        )}

        {/* Upload spinner */}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Ачаалж байна" />
          </span>
        )}
      </div>

      {/* Camera capture input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isBusy}
          className="w-full max-w-[200px]"
        >
          <Camera className="mr-1.5 size-3.5" aria-hidden="true" />
          {isBusy ? "Ачаалж байна..." : "Зураг авах"}
        </Button>
        {displayUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isBusy}
            className="w-full max-w-[200px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
            Устгах
          </Button>
        )}
      </div>
    </div>
  );
}
