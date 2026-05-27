"use client";

import { Monitor, Moon, Palette, Sun } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SettingsForm } from "./_business-defaults-form";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const BRAND_COLOR_PRESETS = [
  { label: "Default", value: "" },
  { label: "Slate", value: "#334155" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Purple", value: "#9333ea" },
  { label: "Teal", value: "#0d9488" },
  { label: "Pink", value: "#db2777" },
];

interface AppearanceCustomizationProps {
  form: SettingsForm;
  setForm: Dispatch<SetStateAction<SettingsForm>>;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  preview: (color: string) => void;
}

export function AppearanceCustomization({
  form,
  setForm,
  theme,
  setTheme,
  preview,
}: AppearanceCustomizationProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
            <Palette className="size-3.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
            <CardDescription className="text-xs">
              Choose your preferred color theme.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-5">
        <Field>
          <FieldLabel>Theme</FieldLabel>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    theme === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Separator />

        <Field>
          <FieldLabel>Brand color</FieldLabel>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-xs"
              className="size-9 rounded-full overflow-hidden p-0 border-2 relative shrink-0"
              render={<label />}
              style={{
                backgroundColor:
                  form.brandColor ||
                  (typeof document !== "undefined"
                    ? getComputedStyle(document.documentElement)
                        .getPropertyValue("--primary")
                        .trim()
                    : "") ||
                  "#000000",
              }}
              aria-label="Brand color picker"
            >
              <input
                type="color"
                value={
                  form.brandColor ||
                  (typeof document !== "undefined"
                    ? getComputedStyle(document.documentElement)
                        .getPropertyValue("--primary")
                        .trim()
                    : "") ||
                  "#000000"
                }
                onChange={(e) => {
                  const color = e.target.value;
                  setForm((prev) => ({ ...prev, brandColor: color }));
                  preview(color);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
            <Input
              value={form.brandColor}
              onChange={(e) => {
                const color = e.target.value;
                setForm((prev) => ({ ...prev, brandColor: color }));
                if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                  preview(color);
                }
              }}
              placeholder="#334155"
              className="w-32 font-mono text-sm"
              maxLength={7}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {BRAND_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    brandColor: preset.value,
                  }));
                  preview(preset.value);
                }}
                className={`size-9 rounded-full border-2 transition-all ${
                  form.brandColor === preset.value ||
                  (!form.brandColor && preset.value === "")
                    ? "border-foreground scale-110 ring-2 ring-foreground/20"
                    : "border-border hover:scale-110"
                }`}
                style={{
                  backgroundColor:
                    preset.value ||
                    (typeof document !== "undefined"
                      ? getComputedStyle(document.documentElement)
                          .getPropertyValue("--primary")
                          .trim()
                      : "") ||
                    "#000000",
                }}
                title={preset.label}
                aria-label={preset.label}
              />
            ))}
          </div>
        </Field>

      </CardContent>
    </Card>
  );
}
