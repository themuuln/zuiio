"use client";

import {
  DownloadSimple,
  ImageSquare,
  Palette,
  PencilLine,
  Repeat,
  Sparkle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useActionState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type GenerateLogoResult, generateLogoAction } from "./actions";

// ── Style options ───────────────────────────────────────────────
const LOGO_STYLES = [
  {
    id: "minimal",
    label: "Минимал",
    icon: PencilLine,
    description: "Энгийн, цэвэрхэн",
  },
  {
    id: "modern",
    label: "Орчин үеийн",
    icon: Sparkle,
    description: "Шинэлэг, загварлаг",
  },
  {
    id: "classic",
    label: "Сонгодог",
    icon: ImageSquare,
    description: "Уламжлалт, итгэл төгс",
  },
  {
    id: "playful",
    label: "Хөгжилтэй",
    icon: Palette,
    description: "Өнгөлөг, хөгжилтэй",
  },
] as const;

const INDUSTRIES = [
  "Худалдаа",
  "Үйлчилгээ",
  "Ресторан",
  "Технологи",
  "Боловсрол",
  "Эрүүл мэнд",
  "Барилга",
  "Спорт",
  "Соёл урлаг",
  "Бусад",
] as const;

// ── Page Component ───────────────────────────────────────────────
export default function AiLogoPage() {
  const [state, formAction, isPending] = useActionState<
    GenerateLogoResult | undefined,
    FormData
  >(generateLogoAction, undefined);

  // ── Toast errors ──────────────────────────────────────────────
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // ── Download handler ──────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!state?.imageUrl) return;
    const a = document.createElement("a");
    a.href = state.imageUrl;
    a.download = `logo-${Date.now()}.png`;
    a.click();
  }, [state]);

  // ── Copy URL handler ──────────────────────────────────────────
  const handleCopyUrl = useCallback(() => {
    if (!state?.imageUrl) return;
    navigator.clipboard.writeText(state.imageUrl);
    toast.success("Логоны холбоос хуулагдлаа");
  }, [state]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <PageShell
      title="AI Лого Үүсгэгч"
      description="Бизнесийн нэр болон салбараа оруулж AI тусламжтайгаар лого үүсгэх"
    >
      <Card className="mx-auto max-w-2xl">
        <CardContent className="px-6 py-8">
          <form action={formAction} className="space-y-8">
            {/* ── Business Name ── */}
            <div>
              <Label htmlFor="businessName" className="text-base font-semibold">
                Бизнесийн нэр
              </Label>
              <p className="mb-2 text-sm text-muted-foreground">
                Лого дээр харуулах компани эсвэл бизнесийн нэр
              </p>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Жишээ: Номин Худалдаа, Эрдэнэт ХХК"
                required
                disabled={isPending}
                className="mt-1.5"
              />
            </div>

            {/* ── Industry ── */}
            <div>
              <Label htmlFor="industry" className="text-base font-semibold">
                Салбар
              </Label>
              <p className="mb-2 text-sm text-muted-foreground">
                Бизнесийн салбараа сонгоно уу
              </p>
              <Select name="industry" disabled={isPending}>
                <SelectTrigger id="industry" className="mt-1.5">
                  <SelectValue placeholder="Салбар сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Logo Style ── */}
            <div>
              <h3 className="mb-1 text-base font-semibold">Загвар сонгох</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Логоны хэв маяг
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LOGO_STYLES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center text-xs transition-all has-checked:border-primary has-checked:bg-primary/5 has-checked:ring-1 has-checked:ring-primary/20 hover:border-muted-foreground/30 hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="style"
                        value={s.id}
                        className="sr-only"
                        defaultChecked={s.id === "minimal"}
                      />
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground has-checked:bg-primary has-checked:text-primary-foreground">
                        <Icon className="size-5" weight="bold" />
                      </div>
                      <span className="font-medium leading-tight">
                        {s.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {s.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Generate button ── */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Лого үүсгэж байна...
                </>
              ) : (
                <>
                  <ImageSquare className="size-5" weight="bold" />
                  Лого үүсгэх
                </>
              )}
            </Button>
          </form>

          {/* ── Loading skeleton ── */}
          {isPending && !state?.imageUrl && (
            <div className="mt-8 mx-auto max-w-xs space-y-4">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {state?.imageUrl && !isPending && (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-600">
                  Лого бэлэн боллоо!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Та логоо татаж авах боломжтой
                </p>
              </div>

              {/* Logo preview */}
              <div className="mx-auto max-w-xs">
                <div className="relative aspect-square overflow-hidden rounded-xl border bg-white shadow-lg">
                  <Image
                    src={state.imageUrl}
                    alt={`${state.businessName ?? "Бизнес"} лого`}
                    fill
                    className="object-contain p-4"
                    unoptimized
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" className="gap-2" onClick={handleDownload}>
                  <DownloadSimple className="size-5" weight="bold" />
                  Лого татах
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

              {/* Reset */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.reload()}
                >
                  <Repeat className="size-4" weight="bold" />
                  Шинэ лого үүсгэх
                </Button>
              </div>
            </div>
          )}

          {/* ── Error state ── */}
          {state?.error && !isPending && (
            <div className="mt-8 text-center">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
