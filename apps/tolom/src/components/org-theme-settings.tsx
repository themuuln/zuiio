"use client";

import {
  BRAND_THEMES,
  type BrandConfig,
  DEFAULT_BRAND_CONFIG,
  FONT_OPTIONS,
  generateBrandCSS,
  resolveBrandConfig,
} from "@zuiio/branding";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  useBrandThemeQuery,
  useUpdateBrandTheme,
} from "@/lib/queries/use-org-theme";

/** Apply brand CSS to the document for live preview. */
function applyBrandCSS(config: BrandConfig) {
  const css = generateBrandCSS(config);
  const id = "brand-theme";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/** Radius presets as rem values (displayed as nice labels). */
const RADIUS_OPTIONS = [
  { label: "Sharp", value: 0 },
  { label: "Subtle", value: 0.25 },
  { label: "Medium", value: 0.375 },
  { label: "Rounded", value: 0.5 },
  { label: "Pill", value: 0.75 },
] as const;

export function BrandSettings({ orgId }: { orgId: string }) {
  const { data: themeData } = useBrandThemeQuery(orgId);
  const updateTheme = useUpdateBrandTheme(orgId);

  const [localConfig, setLocalConfig] =
    useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with server data
  useEffect(() => {
    if (themeData?.branding) {
      setLocalConfig(themeData.branding);
    }
  }, [themeData?.branding]);

  // Live preview: apply CSS whenever local config changes
  useEffect(() => {
    if (hasChanges) {
      applyBrandCSS(localConfig);
    }
  }, [localConfig, hasChanges]);

  const updateConfig = (updates: Partial<BrandConfig>) => {
    setLocalConfig((prev) => resolveBrandConfig({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateTheme.mutate(localConfig, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_BRAND_CONFIG);
    setHasChanges(true);
    applyBrandCSS(DEFAULT_BRAND_CONFIG);
  };

  const isDefaultConfig =
    JSON.stringify(localConfig) === JSON.stringify(DEFAULT_BRAND_CONFIG);

  // Split themes: Zuiio first, then advanced presets
  const defaultTheme = BRAND_THEMES.find((t) => t.name === "zuiio");
  const advancedThemes = BRAND_THEMES.filter((t) => t.name !== "zuiio");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Settings Panel */}
      <div className="flex flex-col gap-y-6">
        {/* Theme Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Preset</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            {/* Zuiio Default — visually distinct */}
            {defaultTheme && (
              <button
                type="button"
                onClick={() => updateConfig({ theme: defaultTheme.name })}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-[border-color,background-color] duration-200 ${
                  localConfig.theme === defaultTheme.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div
                  className="size-10 rounded-full"
                  style={{ background: defaultTheme.light["--primary"] }}
                />
                <div className="flex-1 text-left">
                  <Typography.Text className="font-medium">
                    {defaultTheme.label} Default
                  </Typography.Text>
                  <Typography.Text className="text-xs text-muted-foreground">
                    Company-wide teal identity
                  </Typography.Text>
                </div>
                {localConfig.theme === defaultTheme.name && (
                  <Check className="size-5 text-primary" />
                )}
              </button>
            )}

            {/* Advanced presets — grid */}
            <div className="grid grid-cols-4 gap-3">
              {advancedThemes.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateConfig({ theme: preset.name })}
                  className="group flex flex-col items-center gap-2"
                >
                  <div
                    className="relative size-12 rounded-full border-2 transition-[transform,border-color,box-shadow] duration-200 group-hover:scale-110"
                    style={{ background: preset.light["--primary"] }}
                  >
                    {localConfig.theme === preset.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="size-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <Typography.Text className="text-xs text-muted-foreground">
                    {preset.label}
                  </Typography.Text>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Colors</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            {(["primary", "secondary", "accent"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-y-2">
                <label className="text-sm font-medium capitalize">
                  {key} Color
                </label>
                <input
                  type="text"
                  value={localConfig.custom_colors?.[key] ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      custom_colors: {
                        ...localConfig.custom_colors,
                        [key]: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="e.g. oklch(0.70 0.16 195) or #2563eb"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card>
          <CardHeader>
            <CardTitle>Border Radius</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateConfig({ radius: option.value })}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-[color,background-color,border-color] duration-200 ${
                    localConfig.radius === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div
                    className="size-8 border-2 border-foreground"
                    style={{ borderRadius: `${option.value}rem` }}
                  />
                  <Typography.Text className="text-xs">
                    {option.label}
                  </Typography.Text>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fonts */}
        <Card>
          <CardHeader>
            <CardTitle>Fonts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-medium">Body Font</label>
              <select
                value={localConfig.font_body ?? ""}
                onChange={(e) =>
                  updateConfig({ font_body: e.target.value || undefined })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-medium">Heading Font</label>
              <select
                value={localConfig.font_heading ?? ""}
                onChange={(e) =>
                  updateConfig({ font_heading: e.target.value || undefined })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isDefaultConfig && !hasChanges}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset to Zuiio Default
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateTheme.isPending}
          >
            {updateTheme.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex flex-col gap-y-4">
        <Typography.Text className="text-sm font-medium text-muted-foreground">
          Live Preview
        </Typography.Text>

        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-y-4">
            {/* Buttons */}
            <div className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>

            {/* Card */}
            <div className="rounded-lg border p-4">
              <Typography.Text className="font-medium">
                Sample Card
              </Typography.Text>
              <Typography.Text className="text-sm text-muted-foreground">
                This card uses your theme colors.
              </Typography.Text>
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                Primary Badge
              </span>
              <span className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                Accent Badge
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
