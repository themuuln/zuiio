"use client";

import {
  CaretDown,
  CaretUp,
  ImageSquare,
  Plus,
  Sparkle,
  Star,
  X,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 5;

interface ProductImageManagerProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export function ProductImageManager({
  imageUrls,
  onChange,
}: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const newUrls: string[] = [];

      for (const file of Array.from(files).slice(0, remaining)) {
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImage(file);
        const ext = compressed.name.split(".").pop();
        const filePath = `products/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("brand_assets")
          .upload(filePath, compressed);
        if (error) throw error;

        const { data } = supabase.storage
          .from("brand_assets")
          .getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      onChange([...imageUrls, ...newUrls]);
    } catch (err) {
      capture(err, { context: "ProductImageManager: upload" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(imageUrls.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...imageUrls];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= imageUrls.length - 1) return;
    const next = [...imageUrls];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...imageUrls];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div className="space-y-2">
      <Label>
        Зургууд ({imageUrls.length}/{MAX_IMAGES})
      </Label>
      <div className="flex flex-wrap gap-3">
        {imageUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            className="group relative"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
          >
            <Image
              src={url}
              alt={`Зураг ${index + 1}`}
              width={96}
              height={96}
              className={cn(
                "h-24 w-24 rounded-lg border-2 object-cover transition-all",
                index === 0
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border",
              )}
            />
            {/* Cover badge */}
            {index === 0 && (
              <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                <Star className="size-2.5" /> Нүүр зураг
              </span>
            )}
            {/* Controls */}
            <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
              >
                <X className="size-3" />
              </button>
            </div>
            <div className="absolute bottom-1 right-1 hidden gap-0.5 group-hover:flex">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  className="flex size-5 items-center justify-center rounded bg-background/80 text-foreground shadow"
                >
                  <CaretUp className="size-3" />
                </button>
              )}
              {index < imageUrls.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  className="flex size-5 items-center justify-center rounded bg-background/80 text-foreground shadow"
                >
                  <CaretDown className="size-3" />
                </button>
              )}
            </div>
          </button>
        ))}
        {/* Upload button */}
        {imageUrls.length < MAX_IMAGES && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60">
            {uploading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <>
                <Plus className="size-5" />
                <span className="mt-1 text-xs">Нэмэх</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {/* AI Actions */}
      <div className="flex gap-2 pt-1">
        {imageUrls[0] && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-600 hover:text-amber-700"
              onClick={async () => {
                try {
                  toast.loading("Зураг сайжруулж байна...");
                  const { enhanceProductPhoto } = await import(
                    "@/lib/ai/image-enhancer"
                  );
                  const result = await enhanceProductPhoto(imageUrls[0]);
                  toast.dismiss();
                  if (result.imageUrl) {
                    onChange([result.imageUrl, ...imageUrls.slice(1)]);
                    toast.success("Зураг сайжруулагдлаа!");
                  } else {
                    toast.error(result.error || "Алдаа гарлаа");
                  }
                } catch (_err) {
                  toast.dismiss();
                  toast.error("Зураг сайжруулахад алдаа гарлаа");
                }
              }}
            >
              <ImageSquare className="size-3" />
              AI сайжруулах
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-600 hover:text-amber-700"
              onClick={() => {
                window.open(
                  `/ai/poster?image=${encodeURIComponent(imageUrls[0])}`,
                  "_blank",
                );
              }}
            >
              <Sparkle className="size-3" />
              AI постер
            </Button>
          </>
        )}
      </div>
      {imageUrls.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Зураг нэмнэ үү. Анхны зураг нүүр зураг болно.
        </p>
      )}
    </div>
  );
}
