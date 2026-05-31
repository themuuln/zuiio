"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrgTheme } from "@/components/org-theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { OrgTheme } from "@/lib/types";

// shadcn base color presets (from official docs)
// Each preset includes light + dark mode values
const SHADCN_PRESETS: {
  name: string;
  light: { primary: string; accent: string; [key: string]: string };
  dark: { primary: string; accent: string; [key: string]: string };
}[] = [
  {
    name: "Neutral",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0 0)",
      primary: "oklch(0.205 0 0)",
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      "secondary-foreground": "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      "popover-foreground": "oklch(0.985 0 0)",
      primary: "oklch(0.922 0 0)",
      "primary-foreground": "oklch(0.205 0 0)",
      secondary: "oklch(0.269 0 0)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      "muted-foreground": "oklch(0.708 0 0)",
      accent: "oklch(0.269 0 0)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0 0)",
    },
  },
  {
    name: "Stone",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.005 286)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.005 286)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.005 286)",
      primary: "oklch(0.205 0.006 286)",
      "primary-foreground": "oklch(0.985 0.001 286)",
      secondary: "oklch(0.97 0.001 286)",
      "secondary-foreground": "oklch(0.205 0.006 286)",
      muted: "oklch(0.97 0.001 286)",
      "muted-foreground": "oklch(0.556 0.005 286)",
      accent: "oklch(0.97 0.001 286)",
      "accent-foreground": "oklch(0.205 0.006 286)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.004 286)",
      input: "oklch(0.922 0.004 286)",
      ring: "oklch(0.708 0.005 286)",
    },
    dark: {
      background: "oklch(0.145 0.005 286)",
      foreground: "oklch(0.985 0.001 286)",
      card: "oklch(0.205 0.006 286)",
      "card-foreground": "oklch(0.985 0.001 286)",
      popover: "oklch(0.205 0.006 286)",
      "popover-foreground": "oklch(0.985 0.001 286)",
      primary: "oklch(0.922 0.004 286)",
      "primary-foreground": "oklch(0.205 0.006 286)",
      secondary: "oklch(0.269 0.006 286)",
      "secondary-foreground": "oklch(0.985 0.001 286)",
      muted: "oklch(0.269 0.006 286)",
      "muted-foreground": "oklch(0.708 0.005 286)",
      accent: "oklch(0.269 0.006 286)",
      "accent-foreground": "oklch(0.985 0.001 286)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.005 286)",
    },
  },
  {
    name: "Zinc",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.004 285)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.004 285)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.004 285)",
      primary: "oklch(0.205 0.005 285)",
      "primary-foreground": "oklch(0.985 0.001 285)",
      secondary: "oklch(0.97 0.001 285)",
      "secondary-foreground": "oklch(0.205 0.005 285)",
      muted: "oklch(0.97 0.001 285)",
      "muted-foreground": "oklch(0.556 0.004 285)",
      accent: "oklch(0.97 0.001 285)",
      "accent-foreground": "oklch(0.205 0.005 285)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.003 285)",
      input: "oklch(0.922 0.003 285)",
      ring: "oklch(0.708 0.004 285)",
    },
    dark: {
      background: "oklch(0.145 0.004 285)",
      foreground: "oklch(0.985 0.001 285)",
      card: "oklch(0.205 0.005 285)",
      "card-foreground": "oklch(0.985 0.001 285)",
      popover: "oklch(0.205 0.005 285)",
      "popover-foreground": "oklch(0.985 0.001 285)",
      primary: "oklch(0.922 0.003 285)",
      "primary-foreground": "oklch(0.205 0.005 285)",
      secondary: "oklch(0.269 0.005 285)",
      "secondary-foreground": "oklch(0.985 0.001 285)",
      muted: "oklch(0.269 0.005 285)",
      "muted-foreground": "oklch(0.708 0.004 285)",
      accent: "oklch(0.269 0.005 285)",
      "accent-foreground": "oklch(0.985 0.001 285)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.004 285)",
    },
  },
  {
    name: "Mauve",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.008 288)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.008 288)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.008 288)",
      primary: "oklch(0.205 0.01 288)",
      "primary-foreground": "oklch(0.985 0.002 288)",
      secondary: "oklch(0.97 0.002 288)",
      "secondary-foreground": "oklch(0.205 0.01 288)",
      muted: "oklch(0.97 0.002 288)",
      "muted-foreground": "oklch(0.556 0.008 288)",
      accent: "oklch(0.97 0.002 288)",
      "accent-foreground": "oklch(0.205 0.01 288)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.006 288)",
      input: "oklch(0.922 0.006 288)",
      ring: "oklch(0.708 0.008 288)",
    },
    dark: {
      background: "oklch(0.145 0.008 288)",
      foreground: "oklch(0.985 0.002 288)",
      card: "oklch(0.205 0.01 288)",
      "card-foreground": "oklch(0.985 0.002 288)",
      popover: "oklch(0.205 0.01 288)",
      "popover-foreground": "oklch(0.985 0.002 288)",
      primary: "oklch(0.922 0.006 288)",
      "primary-foreground": "oklch(0.205 0.01 288)",
      secondary: "oklch(0.269 0.01 288)",
      "secondary-foreground": "oklch(0.985 0.002 288)",
      muted: "oklch(0.269 0.01 288)",
      "muted-foreground": "oklch(0.708 0.008 288)",
      accent: "oklch(0.269 0.01 288)",
      "accent-foreground": "oklch(0.985 0.002 288)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.008 288)",
    },
  },
  {
    name: "Olive",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.006 100)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.006 100)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.006 100)",
      primary: "oklch(0.205 0.008 100)",
      "primary-foreground": "oklch(0.985 0.002 100)",
      secondary: "oklch(0.97 0.002 100)",
      "secondary-foreground": "oklch(0.205 0.008 100)",
      muted: "oklch(0.97 0.002 100)",
      "muted-foreground": "oklch(0.556 0.006 100)",
      accent: "oklch(0.97 0.002 100)",
      "accent-foreground": "oklch(0.205 0.008 100)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.005 100)",
      input: "oklch(0.922 0.005 100)",
      ring: "oklch(0.708 0.006 100)",
    },
    dark: {
      background: "oklch(0.145 0.006 100)",
      foreground: "oklch(0.985 0.002 100)",
      card: "oklch(0.205 0.008 100)",
      "card-foreground": "oklch(0.985 0.002 100)",
      popover: "oklch(0.205 0.008 100)",
      "popover-foreground": "oklch(0.985 0.002 100)",
      primary: "oklch(0.922 0.005 100)",
      "primary-foreground": "oklch(0.205 0.008 100)",
      secondary: "oklch(0.269 0.008 100)",
      "secondary-foreground": "oklch(0.985 0.002 100)",
      muted: "oklch(0.269 0.008 100)",
      "muted-foreground": "oklch(0.708 0.006 100)",
      accent: "oklch(0.269 0.008 100)",
      "accent-foreground": "oklch(0.985 0.002 100)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.006 100)",
    },
  },
  {
    name: "Mist",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.01 210)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.01 210)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.01 210)",
      primary: "oklch(0.205 0.012 210)",
      "primary-foreground": "oklch(0.985 0.002 210)",
      secondary: "oklch(0.97 0.003 210)",
      "secondary-foreground": "oklch(0.205 0.012 210)",
      muted: "oklch(0.97 0.003 210)",
      "muted-foreground": "oklch(0.556 0.01 210)",
      accent: "oklch(0.97 0.003 210)",
      "accent-foreground": "oklch(0.205 0.012 210)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.008 210)",
      input: "oklch(0.922 0.008 210)",
      ring: "oklch(0.708 0.01 210)",
    },
    dark: {
      background: "oklch(0.145 0.01 210)",
      foreground: "oklch(0.985 0.002 210)",
      card: "oklch(0.205 0.012 210)",
      "card-foreground": "oklch(0.985 0.002 210)",
      popover: "oklch(0.205 0.012 210)",
      "popover-foreground": "oklch(0.985 0.002 210)",
      primary: "oklch(0.922 0.008 210)",
      "primary-foreground": "oklch(0.205 0.012 210)",
      secondary: "oklch(0.269 0.012 210)",
      "secondary-foreground": "oklch(0.985 0.002 210)",
      muted: "oklch(0.269 0.012 210)",
      "muted-foreground": "oklch(0.708 0.01 210)",
      accent: "oklch(0.269 0.012 210)",
      "accent-foreground": "oklch(0.985 0.002 210)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.01 210)",
    },
  },
  {
    name: "Taupe",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.01 60)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.01 60)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.01 60)",
      primary: "oklch(0.205 0.012 60)",
      "primary-foreground": "oklch(0.985 0.002 60)",
      secondary: "oklch(0.97 0.003 60)",
      "secondary-foreground": "oklch(0.205 0.012 60)",
      muted: "oklch(0.97 0.003 60)",
      "muted-foreground": "oklch(0.556 0.01 60)",
      accent: "oklch(0.97 0.003 60)",
      "accent-foreground": "oklch(0.205 0.012 60)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.008 60)",
      input: "oklch(0.922 0.008 60)",
      ring: "oklch(0.708 0.01 60)",
    },
    dark: {
      background: "oklch(0.145 0.01 60)",
      foreground: "oklch(0.985 0.002 60)",
      card: "oklch(0.205 0.012 60)",
      "card-foreground": "oklch(0.985 0.002 60)",
      popover: "oklch(0.205 0.012 60)",
      "popover-foreground": "oklch(0.985 0.002 60)",
      primary: "oklch(0.922 0.008 60)",
      "primary-foreground": "oklch(0.205 0.012 60)",
      secondary: "oklch(0.269 0.012 60)",
      "secondary-foreground": "oklch(0.985 0.002 60)",
      muted: "oklch(0.269 0.012 60)",
      "muted-foreground": "oklch(0.708 0.01 60)",
      accent: "oklch(0.269 0.012 60)",
      "accent-foreground": "oklch(0.985 0.002 60)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.01 60)",
    },
  },
];

const RADIUS_OPTIONS = [
  { label: "Sharp", value: "0px" },
  { label: "Subtle", value: "0.25rem" },
  { label: "Medium", value: "0.375rem" },
  { label: "Rounded", value: "0.5rem" },
  { label: "Pill", value: "0.75rem" },
];

export function OrgThemeSettings() {
  const { theme, setTheme } = useOrgTheme();
  const [localTheme, setLocalTheme] = useState<OrgTheme>(
    theme ?? {
      primaryColor: "oklch(0.205 0 0)",
      accentColor: "oklch(0.97 0 0)",
      radius: "0px",
      fontFamily: "Inter, sans-serif",
    },
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with provider theme
  useEffect(() => {
    if (theme) {
      setLocalTheme(theme);
    }
  }, [theme]);

  const updateTheme = (updates: Partial<OrgTheme>) => {
    const newTheme = { ...localTheme, ...updates };
    setLocalTheme(newTheme);
    setHasChanges(true);
  };

  const handleSave = () => {
    setTheme(localTheme);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultTheme: OrgTheme = {
      primaryColor: "oklch(0.205 0 0)",
      accentColor: "oklch(0.97 0 0)",
      radius: "0px",
      fontFamily: "Inter, sans-serif",
    };
    setLocalTheme(defaultTheme);
    setTheme(defaultTheme);
    setHasChanges(false);
  };

  const handlePresetClick = (preset: {
    light: { primary: string; accent: string };
  }) => {
    updateTheme({
      primaryColor: preset.light.primary,
      accentColor: preset.light.accent,
    });
  };

  // Parse oklch for color input (convert to hex for input[type="color"])
  const oklchToHex = (oklch: string): string => {
    // Simple conversion - in production use a library like culori
    // For now, return a default if parsing fails
    try {
      const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (!match) return "#000000";
      const [, l, c, h] = match;
      // Very basic conversion (not accurate, but works for demo)
      const lightness = parseFloat(l);
      const chroma = parseFloat(c);
      const hue = parseFloat(h);

      // Simple approximation
      if (chroma < 0.01) {
        const gray = Math.round(lightness * 255);
        return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
      }

      // For demo, just return a hue-based color
      const r = Math.round(128 + 127 * Math.cos((hue * Math.PI) / 180));
      const g = Math.round(128 + 127 * Math.cos(((hue - 120) * Math.PI) / 180));
      const b = Math.round(128 + 127 * Math.cos(((hue - 240) * Math.PI) / 180));
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    } catch {
      return "#000000";
    }
  };

  const hexToOklch = (hex: string): string => {
    // Simple conversion - in production use a library like culori
    // For now, just create an oklch value based on hex
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Rough approximation
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const c = Math.sqrt((r - l) ** 2 + (g - l) ** 2 + (b - l) ** 2);
    const h = Math.atan2(g - b, r - l) * (180 / Math.PI);

    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Settings Panel */}
      <div className="space-y-6">
        {/* Color Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Color Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {SHADCN_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="group flex flex-col items-center gap-2"
                >
                  <div
                    className="relative size-12 rounded-full border-2 transition-all group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${oklchToHex(preset.light.primary)} 50%, ${oklchToHex(preset.light.accent)} 50%)`,
                    }}
                  >
                    {localTheme.primaryColor === preset.light.primary &&
                      localTheme.accentColor === preset.light.accent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="size-5 text-white drop-shadow-md" />
                        </div>
                      )}
                  </div>
                  <Typography.Text className="text-xs text-muted-foreground">
                    {preset.name}
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={oklchToHex(localTheme.primaryColor)}
                    onChange={(e) =>
                      updateTheme({ primaryColor: hexToOklch(e.target.value) })
                    }
                    className="size-10 cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={localTheme.primaryColor}
                    onChange={(e) =>
                      updateTheme({ primaryColor: e.target.value })
                    }
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={oklchToHex(localTheme.accentColor)}
                    onChange={(e) =>
                      updateTheme({ accentColor: hexToOklch(e.target.value) })
                    }
                    className="size-10 cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={localTheme.accentColor}
                    onChange={(e) =>
                      updateTheme({ accentColor: e.target.value })
                    }
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
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
                  onClick={() => updateTheme({ radius: option.value })}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    localTheme.radius === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div
                    className="size-8 border-2 border-foreground"
                    style={{ borderRadius: option.value }}
                  />
                  <Typography.Text className="text-xs">
                    {option.label}
                  </Typography.Text>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-4">
        <Typography.Text className="text-sm font-medium text-muted-foreground">
          Live Preview
        </Typography.Text>

        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <div className="space-y-4">
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
