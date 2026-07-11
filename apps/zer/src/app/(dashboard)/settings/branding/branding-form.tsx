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

export function BrandingForm({ initialConfig }: BrandingFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(initialConfig.theme);
  const [radius, setRadius] = useState(initialConfig.radius);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig.logo_url);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);

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
  const zuiioTheme = BRAND_THEMES.find((t) => t.name === "zuiio");
  const advancedThemes = BRAND_THEMES.filter((t) => t.name !== "zuiio");
  const VISIBLE_ADVANCED = 6;
  const hasMoreThemes = advancedThemes.length > VISIBLE_ADVANCED;
  const visibleThemes = showAllThemes
    ? advancedThemes
    : advancedThemes.slice(0, VISIBLE_ADVANCED);

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
      {/* Theme Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Суурь сэдэв</CardTitle>
          <CardDescription>
            Байгууллагын брэнд өнгөнд тохирсон суурь сэдэв сонгох. Энэ нь
            дэвсгэр, хүрээ, хажуу самбарын өнгүүдийг тодорхойлно.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zuiio default — prominent card */}
          {zuiioTheme && (
            <button
              type="button"
              onClick={() => setSelectedTheme("zuiio")}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                selectedTheme === "zuiio"
                  ? "border-primary ring-2 ring-primary"
                  : "border-muted",
              )}
            >
              <div className="flex -space-x-2">
                <div
                  className="size-8 rounded-full border-2 border-background"
                  style={{ backgroundColor: zuiioTheme.light["--primary"] }}
                />
                <div
                  className="size-8 rounded-full border-2 border-background"
                  style={{ backgroundColor: zuiioTheme.light["--secondary"] }}
                />
                <div
                  className="size-8 rounded-full border-2 border-background"
                  style={{ backgroundColor: zuiioTheme.light["--accent"] }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Zuiio стандарт</p>
                <p className="text-xs text-muted-foreground">
                  Зүйо брэндийн анхны өнгө. Энэ бол стандарт тохиргоо.
                </p>
              </div>
              {selectedTheme === "zuiio" && (
                <Check className="size-5 shrink-0 text-primary" />
              )}
            </button>
          )}

          {/* Advanced presets */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visibleThemes.map((theme) => (
              <ThemeCard
                key={theme.name}
                theme={theme}
                selected={selectedTheme === theme.name}
                onSelect={() => setSelectedTheme(theme.name)}
              />
            ))}
          </div>

          {/* Progressive disclosure toggle */}
          {hasMoreThemes && (
            <button
              type="button"
              onClick={() => setShowAllThemes((v) => !v)}
              className="w-full rounded-md border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {showAllThemes
                ? "Хураах"
                : `Бусад сэдвүүд (${advancedThemes.length - VISIBLE_ADVANCED})`}
            </button>
          )}
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
            Элементүүдийн булангийн дугуйрлыг тохируулах
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.0625}
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="flex-1 h-2 cursor-pointer appearance-none rounded-full bg-muted accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-grab
                [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-grab"
            />
            <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
              {radius.toFixed(3)}rem
            </span>
          </div>
          <div className="flex gap-3">
            {[0.6, 0.8, 1].map((mult) => (
              <div
                key={mult}
                className="size-12 border"
                style={{
                  backgroundColor: mergedLight("--primary"),
                  borderRadius: `${radius * mult}rem`,
                }}
              />
            ))}
          </div>
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

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: BrandTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-accent",
        selected && "border-primary ring-2 ring-primary",
      )}
    >
      <div className="flex -space-x-1.5">
        <div
          className="size-5 rounded-full border"
          style={{ backgroundColor: theme.light["--primary"] }}
        />
        <div
          className="size-5 rounded-full border"
          style={{ backgroundColor: theme.light["--secondary"] }}
        />
        <div
          className="size-5 rounded-full border"
          style={{ backgroundColor: theme.light["--accent"] }}
        />
      </div>
      <span className="text-xs font-medium">{theme.label}</span>
    </button>
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <PreviewButton bg={p} fg={pfg} radius={radius}>
          Товч
        </PreviewButton>
        <PreviewButton bg={s} fg={sfg} radius={radius}>
          Хоёрдогч
        </PreviewButton>
        <PreviewButton bg="transparent" fg={mfg} radius={radius} border={m}>
          Хүрээт
        </PreviewButton>
        <PreviewButton bg={d} fg={pfg} radius={radius}>
          Устгах
        </PreviewButton>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
        <div
          className="rounded-lg border bg-[var(--card-bg,#fff)] p-3 text-[var(--card-fg,#000)] shadow-sm"
          style={{ borderRadius: `${radius}rem` }}
        >
          <p className="text-sm font-medium">Card title</p>
          <p className="text-xs text-muted-foreground">
            Картын агуулга энд харагдана.
          </p>
        </div>
        <div
          className="rounded-lg border bg-[var(--card-bg,#fff)] p-3 text-[var(--card-fg,#000)] shadow-sm"
          style={{ borderRadius: `${radius}rem` }}
        >
          <p className="text-sm font-medium">Card title</p>
          <p className="text-xs text-muted-foreground">
            Картын агуулга энд харагдана.
          </p>
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
  children,
}: {
  bg: string;
  fg: string;
  radius: number;
  border?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="px-4 py-2 text-sm font-medium"
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
