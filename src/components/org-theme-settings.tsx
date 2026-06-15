"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrgTheme } from "@/components/org-theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { OrgTheme } from "@/lib/types";
import {
  hexToOklch,
  oklchToHex,
  RADIUS_OPTIONS,
  SHADCN_PRESETS,
} from "./_theme-color-presets";

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
