"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SettingsForm } from "./_business-defaults-form";
import { SettingsBlock } from "./_settings-layout";

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
  savedBrandColor?: string;
}

export function AppearanceCustomization({
  form,
  setForm,
  theme,
  setTheme,
  preview,
  savedBrandColor,
}: AppearanceCustomizationProps) {
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  return (
    <SettingsBlock>
      <Field>
        <FieldLabel>{t("theme")}</FieldLabel>
        <ToggleGroup
          value={theme ? [theme] : []}
          onValueChange={(value) => {
            const nextTheme = value[0];
            if (nextTheme) {
              setTheme(nextTheme);
            }
          }}
          variant="outline"
          className="flex w-fit flex-wrap gap-1 rounded-lg border border-border p-0.5"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="h-8 rounded-md px-3 text-xs"
              >
                <Icon className="size-3.5" />
                {option.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </Field>

      <Separator />

      <Field>
        <FieldLabel>{t("brandColor")}</FieldLabel>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-xs"
            className="relative size-8 shrink-0 overflow-hidden rounded-full border-2 p-0"
            render={<label />}
            nativeButton={false}
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
            aria-label={t("brandColorPicker")}
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
              className="absolute inset-0 cursor-pointer opacity-0"
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
            placeholder={t("brandColorPlaceholder")}
            className="h-8 w-28 font-mono text-xs"
            maxLength={7}
          />
        </div>
        {savedBrandColor ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm((prev) => ({ ...prev, brandColor: savedBrandColor }));
                preview(savedBrandColor);
              }}
              className="h-6 px-2 text-[11px] text-muted-foreground"
            >
              Reset to saved
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
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
              className={`size-7 rounded-full border-2 transition-[transform,border-color,box-shadow] duration-200 ${
                form.brandColor === preset.value ||
                (!form.brandColor && preset.value === "")
                  ? "scale-110 border-foreground ring-2 ring-foreground/20"
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
    </SettingsBlock>
  );
}
