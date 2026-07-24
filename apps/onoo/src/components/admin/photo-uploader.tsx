"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploaderProps {
  entityId: string;
  entityType: "player" | "team";
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export function PhotoUploader({
  entityId,
  entityType,
  currentUrl,
  onUploaded,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = preview ?? currentUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Зөвхөн JPEG, PNG, Webp файл хүлээн авна");
      return;
    }

    if (f.size > MAX_SIZE) {
      toast.error("Файлын хэмжээ 2MB-аас хэтрэх ёсгүй");
      return;
    }

    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        entityType === "player"
          ? `/admin/api/players/${entityId}/photo`
          : `/admin/api/teams/${entityId}/logo`;

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error ?? "Upload failed");
      }

      toast.success(
        entityType === "player"
          ? "Зураг амжилттай нэмэгдлээ"
          : "Лого амжилттай нэмэгдлээ",
      );
      onUploaded(
        entityType === "player" ? body.photo_url : body.logo_url,
      );
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {displayUrl ? (
          <div className="relative">
            <img
              src={displayUrl}
              alt=""
              className="size-16 rounded-full object-cover"
            />
            {preview && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                aria-label="Цуцлах"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="size-5" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id={`upload-${entityType}-${entityId}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Файл сонгох
          </Button>
          {preview && (
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={handleUpload}
            >
              {uploading ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
