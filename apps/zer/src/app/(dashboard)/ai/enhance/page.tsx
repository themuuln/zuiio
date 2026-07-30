"use client";

import {
  Camera,
  DownloadSimple,
  ImageSquare,
  MagicWand,
  Repeat,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { enhanceProductPhotoAction, removeBackgroundAction } from "./actions";

// ── Action type ─────────────────────────────────────────────────
type EnhancementMode = "remove-bg" | "enhance" | null;

// ── Page Component ───────────────────────────────────────────────
export default function AiEnhancePage() {
  // Upload state
  const [originalUrl, setOriginalUrl] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhancement state
  const [mode, setMode] = useState<EnhancementMode>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);

  // ── Upload image ───────────────────────────────────────────────
  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Зураг оруулна уу");
      return;
    }
    setUploading(true);
    setError(null);
    setResultUrl(null);
    setShowComparison(false);

    try {
      const supabase = createClient();
      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop() ?? "jpg";
      const filePath = `enhance/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand_assets")
        .upload(filePath, compressed);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("brand_assets")
        .getPublicUrl(filePath);

      setOriginalUrl(URL.createObjectURL(file));
      setOriginalFile(file);
      setStoredUrl(urlData.publicUrl);
    } catch (err) {
      capture(err, { context: "AiEnhance:uploadImage" });
      toast.error("Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadImage(file);
      e.target.value = "";
    },
    [uploadImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadImage(file);
    },
    [uploadImage],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeImage = useCallback(() => {
    setOriginalUrl("");
    setOriginalFile(null);
    setStoredUrl(null);
    setResultUrl(null);
    setShowComparison(false);
    setError(null);
    setMode(null);
  }, []);

  // ── Remove background ─────────────────────────────────────────
  const handleRemoveBackground = useCallback(async () => {
    if (!storedUrl) return;
    setMode("remove-bg");
    setProcessing(true);
    setError(null);
    setResultUrl(null);

    try {
      const result = await removeBackgroundAction(storedUrl);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.imageUrl) {
        setResultUrl(result.imageUrl);
        setShowComparison(true);
      }
    } catch (err) {
      capture(err, { context: "AiEnhance:removeBackground" });
      setError("Дэвсгэр арилгахад алдаа гарлаа");
    } finally {
      setProcessing(false);
    }
  }, [storedUrl]);

  // ── Enhance product photo ─────────────────────────────────────
  const handleEnhance = useCallback(async () => {
    if (!storedUrl) return;
    setMode("enhance");
    setProcessing(true);
    setError(null);
    setResultUrl(null);

    try {
      const result = await enhanceProductPhotoAction(storedUrl);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.imageUrl) {
        setResultUrl(result.imageUrl);
        setShowComparison(true);
      }
    } catch (err) {
      capture(err, { context: "AiEnhance:enhance" });
      setError("Зураг сайжруулахад алдаа гарлаа");
    } finally {
      setProcessing(false);
    }
  }, [storedUrl]);

  // ── Download result ────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${mode === "remove-bg" ? "no-bg" : "enhanced"}-${Date.now()}.png`;
    a.click();
  }, [resultUrl, mode]);

  // ── Copy result URL ────────────────────────────────────────────
  const handleCopyUrl = useCallback(() => {
    if (!resultUrl) return;
    navigator.clipboard.writeText(resultUrl);
    toast.success("Зургийн холбоос хуулагдлаа");
  }, [resultUrl]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <PageShell
      title="AI Зураг Сайжруулагч"
      description="Бүтээгдэхүүний зурагнаас дэвсгэр арилгах, чанарыг сайжруулах"
    >
      <Card className="mx-auto max-w-2xl">
        <CardContent className="px-6 py-8">
          <div className="space-y-8">
            {/* ── Upload section ── */}
            <div>
              <h3 className="mb-1 text-lg font-semibold">Зураг оруулах</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Сайжруулах бүтээгдэхүүний зураг
              </p>

              {!originalUrl ? (
                <button
                  type="button"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30",
                  )}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                      <p className="text-sm text-muted-foreground">
                        Зураг хуулагдаж байна...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <Camera className="size-6 text-primary" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Зураг оруулах</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Чирж оруулах эсвэл товшиж сонгох
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Дэмжих формат: JPG, PNG, WebP
                      </Badge>
                    </>
                  )}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </button>
              ) : (
                <div className="relative mx-auto max-w-sm">
                  <div className="relative aspect-square overflow-hidden rounded-xl border">
                    <Image
                      src={originalUrl}
                      alt="Бүтээгдэхүүний зураг"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                    onClick={removeImage}
                  >
                    <X className="size-4" />
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {originalFile?.name ?? "Зураг оруулсан"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Action buttons (shown after upload) ── */}
            {originalUrl && !showComparison && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleRemoveBackground}
                  disabled={processing}
                >
                  {processing && mode === "remove-bg" ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <MagicWand className="size-5" weight="bold" />
                  )}
                  Дэвсгэр арилгах
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleEnhance}
                  disabled={processing}
                >
                  {processing && mode === "enhance" ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Sparkle className="size-5" weight="bold" />
                  )}
                  Зураг сайжруулах
                </Button>
              </div>
            )}

            {/* ── Processing skeleton ── */}
            {processing && !resultUrl && (
              <div className="mx-auto max-w-sm space-y-4">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}

            {/* ── Before / After comparison ── */}
            {showComparison && resultUrl && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-600">
                    {mode === "remove-bg"
                      ? "Дэвсгэр амжилттай арилгалаа!"
                      : "Зураг амжилттай сайжрууллаа!"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Харьцуулалтыг харж, үр дүнг татаж авах боломжтой
                  </p>
                </div>

                {/* Comparison grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                      Анхны зураг
                    </p>
                    <div className="relative aspect-square overflow-hidden rounded-xl border">
                      <Image
                        src={originalUrl}
                        alt="Анхны зураг"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                      {mode === "remove-bg" ? "Дэвсгэргүй" : "Сайжруулсан"}
                    </p>
                    <div className="relative aspect-square overflow-hidden rounded-xl border ring-2 ring-primary/20">
                      <Image
                        src={resultUrl}
                        alt="Үр дүн"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" className="gap-2" onClick={handleDownload}>
                    <DownloadSimple className="size-5" weight="bold" />
                    Зураг татах
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleCopyUrl}
                  >
                    <ImageSquare className="size-5" weight="bold" />
                    Холбоос хуулах
                  </Button>
                </div>

                {/* More actions */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={
                      mode === "remove-bg"
                        ? handleRemoveBackground
                        : handleEnhance
                    }
                    disabled={processing}
                  >
                    <Repeat className="size-4" weight="bold" />
                    Дахин хийх
                  </Button>
                  <Button
                    variant={mode === "remove-bg" ? "outline" : "default"}
                    className="gap-2"
                    onClick={
                      mode === "remove-bg"
                        ? handleEnhance
                        : handleRemoveBackground
                    }
                    disabled={processing}
                  >
                    {mode === "remove-bg" ? (
                      <>
                        <Sparkle className="size-4" weight="bold" />
                        Зураг сайжруулах
                      </>
                    ) : (
                      <>
                        <MagicWand className="size-4" weight="bold" />
                        Дэвсгэр арилгах
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Error banner ── */}
            {error && !processing && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
