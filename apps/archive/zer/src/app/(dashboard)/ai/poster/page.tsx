"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Camera,
  Check,
  DownloadSimple,
  ForkKnife,
  ImageSquare,
  Images,
  Leaf,
  MagicWand,
  Monitor,
  Palette,
  PencilLine,
  Repeat,
  Sparkle,
  Tag,
  X,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Image from "next/image";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { generatePoster, PLATFORM_SIZES, POSTER_STYLES } from "./actions";

// ── Style icon map ───────────────────────────────────────────────
const STYLE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  minimal: Images,
  luxury: Sparkle,
  sale: Tag,
  seasonal: CalendarBlank,
  modern: Palette,
  nature: Leaf,
  tech: Monitor,
  food: ForkKnife,
  custom: PencilLine,
};

// ── Steps configuration ──────────────────────────────────────────
const STEPS = [
  { label: "Зураг оруулах", description: "Бүтээгдэхүүний зураг" },
  { label: "Загвар сонгох", description: "Загвар, платформ, текст" },
  { label: "Постер харах", description: "Үр дүнг харах, татах" },
] as const;

const PLATFORM_OPTIONS = Object.entries(PLATFORM_SIZES).map(([key, val]) => ({
  key,
  label: val.label,
}));

// ── Page Component ───────────────────────────────────────────────
export default function AiPosterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — image state
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — style, platform, text
  const [styleId, setStyleId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [text, setText] = useState("");

  // Step 3 — generation result
  const [state, formAction, isPending] = useActionState<
    { posterUrl?: string; error?: string } | undefined,
    FormData
  >(
    generatePoster as (
      prev: { posterUrl?: string; error?: string } | undefined,
      formData: FormData,
    ) => Promise<{ posterUrl?: string; error?: string } | undefined>,
    undefined,
  );

  // ── Upload image ───────────────────────────────────────────────
  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Зураг оруулна уу");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop() ?? "jpg";
      const filePath = `posters/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("brand_assets")
        .upload(filePath, compressed);
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("brand_assets")
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      setImageFile(file);
    } catch (err) {
      capture(err, { context: "AiPoster:uploadImage" });
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
    setImageUrl("");
    setImageFile(null);
  }, []);

  // ── Submit generation ──────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    if (!imageUrl) {
      toast.error("Эхлээд зураг оруулна уу");
      return;
    }
    if (!styleId) {
      toast.error("Загвар сонгоно уу");
      return;
    }
    const fd = new FormData();
    fd.set("imageUrl", imageUrl);
    fd.set("styleId", styleId);
    fd.set("stylePrompt", styleId === "custom" ? customPrompt : "");
    fd.set("platform", platform);
    fd.set("text", text);
    formAction(fd);
  }, [imageUrl, styleId, customPrompt, platform, text, formAction]);

  // ── Toast errors from generation ───────────────────────────────
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // ── Step navigation ────────────────────────────────────────────
  const goNext = () => {
    if (step === 1 && imageUrl) setStep(2);
    else if (step === 2 && styleId) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const resetAll = () => {
    setStep(1);
    setImageUrl("");
    setImageFile(null);
    setStyleId(null);
    setCustomPrompt("");
    setPlatform("instagram");
    setText("");
  };

  const canGoNext = () => {
    if (step === 1) return !!imageUrl;
    if (step === 2) return !!styleId;
    return true;
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <PageShell
      title="AI Постер Үүсгэгч"
      description="Бүтээгдэхүүний зурагнаас AI тусламжтайгаар постер үүсгэх"
    >
      <Card>
        <CardContent className="px-6 py-8">
          {/* ── Step indicator ── */}
          <div className="mb-8 flex items-center justify-center gap-0">
            {STEPS.map((s, i) => {
              const num = (i + 1) as 1 | 2 | 3;
              const active = step === num;
              const done = step > num;
              return (
                <div key={num} className="flex items-center">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      active &&
                        "bg-primary text-primary-foreground ring-2 ring-primary/20",
                      done && "bg-primary/10 text-primary",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-4" weight="bold" /> : num}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div
                      className={cn(
                        "text-xs font-medium",
                        (active || done) && "text-foreground",
                        !active && !done && "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.description}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-3 h-px w-8 sm:w-16",
                        done ? "bg-primary/30" : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ══ Step 1: Image Upload ══ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Бүтээгдэхүүний зураг оруулах
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Постерт ашиглах бүтээгдэхүүний зураг
                </p>
              </div>

              {!imageUrl ? (
                <div
                  role="button"
                  tabIndex={0}
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
                </div>
              ) : (
                <div className="relative mx-auto max-w-sm">
                  <div className="relative aspect-square overflow-hidden rounded-xl border">
                    <Image
                      src={imageUrl}
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
                    {imageFile?.name ?? "Зураг оруулсан"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ Step 2: Style Selection ══ */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Style grid */}
              <div>
                <h3 className="mb-1 text-lg font-semibold">Загвар сонгох</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Постерын загварын хэв маяг
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {POSTER_STYLES.map((s) => {
                    const selected = styleId === s.id;
                    const Icon = STYLE_ICONS[s.id];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStyleId(s.id);
                          if (s.id !== "custom") setCustomPrompt("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs transition-all",
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-lg",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {Icon && <Icon className="size-5" />}
                        </div>
                        <span
                          className={cn(
                            "font-medium leading-tight",
                            selected && "text-primary",
                          )}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom prompt (only for "custom" style) */}
              {styleId === "custom" && (
                <div>
                  <Label htmlFor="custom-prompt">
                    Загварын дэлгэрэнгүй тодорхойлолт
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder="Жишээ: Монгол уламжлалт хээ, хөх цагаан өнгө..."
                    className="mt-1.5"
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>
              )}

              {/* Platform */}
              <div>
                <h3 className="mb-1 text-lg font-semibold">Платформ сонгох</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Постерын хэмжээг платформд тохируулан сонгоно
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPlatform(opt.key)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                        platform === opt.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promotional text */}
              <div>
                <Label htmlFor="poster-text">Сурталчилгааны текст</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  AI постер дээр харуулах текст (Монгол кирилл)
                </p>
                <Textarea
                  id="poster-text"
                  placeholder="Жишээ: Шинэ цуглуулга! 50% хямдралтай"
                  className="mt-1.5"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {text.length}/500
                </p>
              </div>
            </div>
          )}

          {/* ══ Step 3: Generate & Preview ══ */}
          {step === 3 && (
            <div className="space-y-6">
              {!state?.posterUrl && !state?.error && !isPending && (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Постер үүсгэх</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Сонгосон тохиргоонуудаар AI постер үүсгэж байна
                    </p>
                  </div>

                  {/* Summary card */}
                  <Card className="mx-auto max-w-sm">
                    <CardContent className="grid grid-cols-2 gap-4 p-4 text-sm">
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Зураг:</span>
                        <div className="relative mt-1 aspect-square overflow-hidden rounded-lg border">
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Загвар:</span>
                        <p className="font-medium">
                          {POSTER_STYLES.find((s) => s.id === styleId)?.label ??
                            "Тохируулах"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Платформ:</span>
                        <p className="font-medium">
                          {PLATFORM_OPTIONS.find((p) => p.key === platform)
                            ?.label ?? platform}
                        </p>
                      </div>
                      {text && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Текст:</span>
                          <p className="font-medium">{text}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={handleGenerate}
                    >
                      <MagicWand className="size-5" weight="bold" />
                      Постер үүсгэх
                    </Button>
                  </div>
                </>
              )}

              {/* Loading state */}
              {isPending && !state?.posterUrl && (
                <div className="mx-auto max-w-sm space-y-4">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              )}

              {/* Result */}
              {state?.posterUrl && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-600">
                      Постер бэлэн боллоо!
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Та постероо татаж авах боломжтой
                    </p>
                  </div>

                  {/* Poster preview */}
                  <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl border shadow-lg">
                    <Image
                      src={state.posterUrl}
                      alt="Үүсгэсэн постер"
                      width={
                        PLATFORM_SIZES[platform as keyof typeof PLATFORM_SIZES]
                          ?.width ?? 1080
                      }
                      height={
                        PLATFORM_SIZES[platform as keyof typeof PLATFORM_SIZES]
                          ?.height ?? 1080
                      }
                      className="h-auto w-full"
                      unoptimized
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = state.posterUrl!;
                        a.download = `poster-${Date.now()}.png`;
                        a.click();
                      }}
                    >
                      <DownloadSimple className="size-5" weight="bold" />
                      Постер татах
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(state.posterUrl!);
                        toast.success("Постерын холбоос хуулагдлаа");
                      }}
                    >
                      <ImageSquare className="size-5" weight="bold" />
                      Холбоос хуулах
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={resetAll}
                    >
                      <Repeat className="size-4" weight="bold" />
                      Шинэ постер үүсгэх
                    </Button>
                  </div>
                </div>
              )}

              {state?.error && !isPending && (
                <div className="text-center">
                  <p className="text-sm text-destructive">
                    Постер үүсгэхэд алдаа гарлаа: {state.error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={handleGenerate}
                  >
                    <Repeat className="size-4" weight="bold" />
                    Дахин оролдох
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Step navigation ── */}
          {step < 3 && (
            <div className="flex items-center justify-between pt-6">
              <div>
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={isPending}
                  >
                    <ArrowLeft className="size-4" weight="bold" />
                    Буцах
                  </Button>
                )}
              </div>
              <Button onClick={goNext} disabled={!canGoNext()}>
                Үргэлжлүүлэх
                <ArrowRight className="size-4" weight="bold" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
