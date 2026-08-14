"use client";

import {
  ArrowsCounterClockwise,
  Check,
  Spinner,
  UploadSimple,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  BRAND_THEMES,
  type BrandConfig,
  type BrandTheme,
  contrastForeground,
  FONT_OPTIONS,
  getFont,
} from "@/lib/branding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { updateBrandConfig } from "./actions";

type BrandingFormProps = {
  initialConfig: BrandConfig;
};

/** shadcn-style discrete radius steps for the public page + dashboard. */
const RADIUS_PRESETS = [0, 0.25, 0.5, 0.75, 1] as const;

function presetLabel(value: number): string {
  return value === 0
    ? "0"
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function BrandingForm({ initialConfig }: BrandingFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(initialConfig.theme);
  const [radius, setRadius] = useState(initialConfig.radius);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig.logo_url);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom color overrides
  const [customColors, setCustomColors] = useState<{
    primary: string;
    secondary: string;
    accent: string;
  }>({
    primary: initialConfig.custom_colors?.primary ?? "",
    secondary: initialConfig.custom_colors?.secondary ?? "",
    accent: initialConfig.custom_colors?.accent ?? "",
  });

  // Font selections
  const [fontBody, setFontBody] = useState(initialConfig.font_body ?? "");
  const [fontHeading, setFontHeading] = useState(
    initialConfig.font_heading ?? "",
  );

  const activeTheme = BRAND_THEMES.find((t) => t.name === selectedTheme);

  // Merged colors for live preview: theme defaults overridden by custom picks
  function mergedLight(key: string): string {
    if (key === "--primary" && customColors.primary)
      return customColors.primary;
    if (key === "--secondary" && customColors.secondary)
      return customColors.secondary;
    if (key === "--accent" && customColors.accent) return customColors.accent;
    return activeTheme?.light[key] ?? "";
  }

  function resetToDefault() {
    setSelectedTheme("zuiio");
    setCustomColors({ primary: "", secondary: "", accent: "" });
    setRadius(0.5);
    setFontBody("");
    setFontHeading("");
  }
  const mutation = useMutation({
    mutationFn: async (data: { removeLogo?: boolean }) => {
      setSaveSuccess(false);
      const formData = new FormData();
      formData.append("theme", selectedTheme);
      formData.append("radius", String(radius));
      if (logoUrl) formData.append("logo_url", logoUrl);
      if (data.removeLogo) formData.append("remove_logo", "true");
      // Append custom colors (empty clears them on server)
      formData.append("custom_primary", customColors.primary);
      formData.append("custom_secondary", customColors.secondary);
      formData.append("custom_accent", customColors.accent);
      // Append font selections
      formData.append("font_body", fontBody);
      formData.append("font_heading", fontHeading);
      return updateBrandConfig(undefined, formData);
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        setSaveSuccess(true);
        toast.success("Брэндинг амжилттай хадгалагдлаа.");
      }
    },
    onError: () => {
      toast.error("Хадгалахад алдаа гарлаа.");
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Файлын хэмжээ 2MB-с бага байх ёстой.");
      return;
    }

    if (
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        file.type,
      )
    ) {
      toast.error("Зөвхөн PNG, JPEG, WebP, SVG формат дэмжигдэнэ.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `logos/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand_assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("brand_assets")
        .getPublicUrl(filePath);

      setLogoUrl(urlData.publicUrl);
      toast.success("Лого амжилттай байршууллаа.");
    } catch (err) {
      toast.error("Лого байршуулахад алдаа гарлаа.");
      capture(err, { context: "branding logo upload" });
    } finally {
      setUploading(false);
    }
  };

  function ColorField({
    label,
    cssVar,
    value,
    onChange,
  }: {
    label: string;
    cssVar: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    const themeColor = activeTheme?.light[cssVar] ?? "";
    // Only sync the native color picker when the current value is valid hex
    const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
    const colorPickerValue = isHex ? value : themeColor;
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colorPickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="size-9 cursor-pointer rounded-md border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm"
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Input
          type="text"
          value={value}
          placeholder="#fabf01 / oklch(...) / hsl(...)"
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-48 font-mono text-xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Цэвэрлэх
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Base color */}
      <Card>
        <CardHeader>
          <CardTitle>Суурь өнгө</CardTitle>
          <CardDescription>
            Брэнд өнгөндөө тохирсон суурь өнгийг сонгох. Энэ нь нийтийн хуудас
            болон самбарын товч, тодруулга, хүрээний өнгүүдийг тодорхойлно.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {BRAND_THEMES.map((theme) => {
              const selected = selectedTheme === theme.name;
              const light = theme.light["--primary"] ?? "";
              const dark = theme.dark["--primary"] ?? "";
              return (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelectedTheme(theme.name)}
                  aria-pressed={selected}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-accent",
                    selected
                      ? "border-primary ring-2 ring-primary"
                      : "border-muted",
                  )}
                >
                  <span
                    className="size-9 rounded-full border shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${light} 0 50%, ${dark} 50% 100%)`,
                    }}
                  />
                  <span className="text-xs font-medium">{theme.label}</span>
                  {selected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Өнгөний тохируулга</CardTitle>
          <CardDescription>
            Товч, тодруулгын өнгүүдийг өөрийн брэнд өнгөөр солих. Суурь сэдвээр
            тохируулаагүй өнгөнүүд автоматаар тодорхойлогдоно.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorField
            label="Primary"
            cssVar="--primary"
            value={customColors.primary}
            onChange={(v) => setCustomColors((p) => ({ ...p, primary: v }))}
          />
          <ColorField
            label="Secondary"
            cssVar="--secondary"
            value={customColors.secondary}
            onChange={(v) => setCustomColors((p) => ({ ...p, secondary: v }))}
          />
          <ColorField
            label="Accent"
            cssVar="--accent"
            value={customColors.accent}
            onChange={(v) => setCustomColors((p) => ({ ...p, accent: v }))}
          />
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle>Үсгийн хэлбэр</CardTitle>
          <CardDescription>
            Биеийн текст болон гарчгийн фонтыг сонгох. Монгол, Кирилл үсэг
            дэмжигдсэн.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Биеийн текст</span>
            <NativeSelect
              value={fontBody}
              onChange={(e) => setFontBody(e.target.value)}
            >
              <NativeSelectOption value="">
                Анхны (Geist Sans)
              </NativeSelectOption>
              {FONT_OPTIONS.map((f) => (
                <NativeSelectOption key={f.name} value={f.name}>
                  {f.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Гарчиг</span>
            <NativeSelect
              value={fontHeading}
              onChange={(e) => setFontHeading(e.target.value)}
            >
              <NativeSelectOption value="">
                {fontBody
                  ? (getFont(fontBody)?.label ?? "Анхны")
                  : "Анхны (Geist Mono)"}
              </NativeSelectOption>
              {FONT_OPTIONS.map((f) => (
                <NativeSelectOption key={f.name} value={f.name}>
                  {f.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {/* Live font preview */}
          {(fontBody || fontHeading) && (
            <div className="rounded-lg border p-4 space-y-2">
              <p
                className="text-lg font-semibold"
                style={{
                  fontFamily: fontHeading
                    ? getFont(fontHeading)?.family
                    : fontBody
                      ? getFont(fontBody)?.family
                      : undefined,
                }}
              >
                Гарчиг фонтын харагдац
              </p>
              <p
                className="text-sm"
                style={{
                  fontFamily: fontBody ? getFont(fontBody)?.family : undefined,
                }}
              >
                Mongolian small business ERP. Монгол жижиг бизнесийн өдөр тутмын
                ажиллагааг нэг төвөөс удирдана. ABC abc 123 !@#
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Булангийн радиус</CardTitle>
          <CardDescription>
            Товч, карт зэрэг элементүүдийн булангийн дугуйрлыг сонгох
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {RADIUS_PRESETS.map((preset) => {
              const selected = radius === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadius(preset)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent",
                    selected
                      ? "border-primary ring-2 ring-primary"
                      : "border-muted",
                  )}
                >
                  <span
                    className="size-6 border"
                    style={{
                      backgroundColor: mergedLight("--primary"),
                      borderRadius: `${Math.max(preset * 0.8, 0.05)}rem`,
                    }}
                  />
                  <span className="text-xs tabular-nums">
                    {presetLabel(preset)}
                  </span>
                </button>
              );
            })}
          </div>
          {!RADIUS_PRESETS.some((p) => p === radius) && (
            <p className="text-xs text-muted-foreground">
              Одоогийн хэмжээ: {radius.toFixed(3)}rem — дээрхээс сонгож
              шинэчилнэ үү.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Лого</CardTitle>
          <CardDescription>
            Байгууллагын лого байршуулах (PNG, JPEG, WebP, SVG — дээд тал нь
            2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                <OptimizedImage
                  src={logoUrl}
                  alt="Байгууллагын лого"
                  width={64}
                  height={64}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLogoUrl(null);
                  mutation.mutate({ removeLogo: true });
                }}
              >
                Лого устгах
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              className="relative"
            >
              {uploading ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Байршуулж байна...
                </>
              ) : (
                <>
                  <UploadSimple className="size-4" />
                  {logoUrl ? "Лого солих" : "Лого байршуулах"}
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Амьд харагдац</CardTitle>
          <CardDescription>
            Сонгосон тохиргоогоо хэрхэн харагдахыг урьдчилан харах
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTheme ? (
            <LivePreview
              key={`${selectedTheme}-${radius}-${customColors.primary}-${customColors.secondary}-${customColors.accent}-${fontBody}-${fontHeading}`}
              theme={activeTheme}
              radius={radius}
              customColors={customColors}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Урьдчилан харахын тулд сэдэв сонгоно уу.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save & Reset */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => mutation.mutate({})}
          disabled={mutation.isPending}
          size="sm"
        >
          {mutation.isPending ? (
            <>
              <Spinner className="size-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={resetToDefault}>
          <ArrowsCounterClockwise className="size-4" />
          Анхны хэлбэртээ буцаах
        </Button>
        {saveSuccess && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500">
            <Check className="size-4" />
            Амжилттай хадгалсан
          </span>
        )}
      </div>
    </div>
  );
}

function LivePreview({
  theme,
  radius,
  customColors,
}: {
  theme: BrandTheme;
  radius: number;
  customColors: { primary: string; secondary: string; accent: string };
}) {
  function c(key: string): string {
    if (key === "--primary" && customColors.primary)
      return customColors.primary;
    if (key === "--secondary" && customColors.secondary)
      return customColors.secondary;
    if (key === "--accent" && customColors.accent) return customColors.accent;
    return theme.light[key] ?? "";
  }

  const p = c("--primary");
  const pfg =
    contrastForeground(customColors.primary) ??
    theme.light["--primary-foreground"];
  const s = c("--secondary");
  const sfg =
    contrastForeground(customColors.secondary) ??
    theme.light["--secondary-foreground"];
  const a = c("--accent");
  const afg =
    contrastForeground(customColors.accent) ??
    theme.light["--accent-foreground"];
  const m = theme.light["--muted"] ?? "";
  const mfg = theme.light["--muted-foreground"] ?? "";
  const d = theme.light["--destructive"] ?? "";
  const cardBg = theme.light["--card"] ?? "#fff";

  return (
    <div className="space-y-4">
      {/* Color swatches */}
      <div className="flex flex-wrap gap-3">
        <Swatch label="Primary" bg={p} fg={pfg} radius={radius} />
        <Swatch label="Secondary" bg={s} fg={sfg} radius={radius} />
        <Swatch label="Accent" bg={a} fg={afg} radius={radius} />
        <Swatch label="Muted" bg={m} fg={mfg} radius={radius} />
        <Swatch label="Destructive" bg={d} fg={pfg} radius={radius} />
      </div>

      {/* Storefront mockup — mirrors how the public page will look */}
      <div
        className="overflow-hidden border shadow-sm"
        style={{ borderRadius: `${radius}rem`, borderColor: m }}
      >
        {/* Banner */}
        <div
          className="h-14 w-full"
          style={{
            background: `linear-gradient(135deg, ${p}33, ${p}11)`,
          }}
        />
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ backgroundColor: cardBg }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: p,
                color: pfg,
                borderRadius: `${radius * 0.8}rem`,
              }}
            >
              Д
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Таны дэлгүүр</p>
              <p className="truncate text-xs" style={{ color: mfg }}>
                Жижиглэн худалдаа
              </p>
            </div>
          </div>
          <PreviewButton bg={p} fg={pfg} radius={radius} className="shrink-0">
            Сагс
          </PreviewButton>
        </div>
        {/* Products */}
        <div
          className="grid grid-cols-2 gap-3 p-4"
          style={{ backgroundColor: cardBg }}
        >
          {["Бүтээгдэхүүн 1", "Бүтээгдэхүүн 2"].map((title) => (
            <div
              key={title}
              className="overflow-hidden border"
              style={{ borderRadius: `${radius}rem`, borderColor: m }}
            >
              <div className="h-16 w-full" style={{ backgroundColor: m }} />
              <div className="space-y-2 p-3">
                <p className="text-xs font-medium">{title}</p>
                <p className="text-sm font-semibold" style={{ color: p }}>
                  ₮ 45,000
                </p>
                <PreviewButton
                  bg={p}
                  fg={pfg}
                  radius={radius}
                  className="w-full"
                >
                  Дэлгэрэнгүй
                </PreviewButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Swatch({
  label,
  bg,
  fg,
  radius,
}: {
  label: string;
  bg: string;
  fg: string;
  radius: number;
}) {
  return (
    <div
      className="flex size-14 items-center justify-center text-xs font-medium"
      style={{
        backgroundColor: bg,
        color: fg,
        borderRadius: `${radius * 0.6}rem`,
      }}
    >
      {label}
    </div>
  );
}

function PreviewButton({
  bg,
  fg,
  radius,
  border,
  className,
  children,
}: {
  bg: string;
  fg: string;
  radius: number;
  border?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn("px-4 py-2 text-sm font-medium", className)}
      style={{
        backgroundColor: bg,
        color: fg,
        borderRadius: `${radius * 0.6}rem`,
        border: border ? `1px solid ${border}` : "none",
      }}
    >
      {children}
    </button>
  );
}
