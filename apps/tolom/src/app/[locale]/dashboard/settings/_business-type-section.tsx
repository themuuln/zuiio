"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Car,
  Droplet,
  Gauge,
  Loader2,
  PaintBucket,
  Truck,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import type { BusinessType } from "@/lib/industry-presets";
import { BUSINESS_TYPES, INDUSTRY_PRESETS } from "@/lib/industry-presets";
import { orgKeys } from "@/lib/queries/keys";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

import { SettingsBlock, SettingsRow } from "./_settings-layout";

interface BusinessTypeSectionProps {
  orgId: string;
  organization: Organization | undefined;
}

const BUSINESS_TYPE_ICONS: Record<
  BusinessType,
  React.ComponentType<{ className?: string }>
> = {
  general_repair: Wrench,
  tire_shop: Gauge,
  body_shop: PaintBucket,
  dealership: Building2,
  fleet: Truck,
  quick_lube: Droplet,
};

export function BusinessTypeSection({
  orgId,
  organization,
}: BusinessTypeSectionProps) {
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const bt = useTranslations("auth.setupOrganization") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentBusinessType = (
    organization?.settings as Record<string, unknown> | null
  )?.business_type as string | undefined;

  const isCurrentlySet =
    currentBusinessType && currentBusinessType in INDUSTRY_PRESETS;

  const updateBusinessType = useMutation({
    mutationFn: async (businessType: string) => {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...(organization?.settings as Record<string, unknown>),
            business_type: businessType,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to update business type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
      toast.success(t("businessTypeSaved"));
      setIsEditing(false);
      setSelectedType(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const partSuggestionsEnabled =
    (organization?.settings as Record<string, unknown> | null)
      ?.enable_part_suggestions !== false;

  const updatePartSuggestions = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...(organization?.settings as Record<string, unknown>),
            enable_part_suggestions: enabled,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to update part suggestions");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
      toast.success(t("partSuggestionsSaved"));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const handleSelect = (type: BusinessType) => {
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!selectedType || !organization) return;
    updateBusinessType.mutate(selectedType);
  };

  return (
    <SettingsBlock>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Car className="size-3.5" />
            </div>
            <Typography.Text className="text-sm font-semibold tracking-tight">
              {t("businessType")}
            </Typography.Text>
          </div>
          <Typography.Muted className="text-xs text-muted-foreground">
            {t("businessTypeDesc")}
          </Typography.Muted>
        </div>

        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {t("change")}
          </Button>
        )}
      </div>

      {isEditing && (
        <>
          <Separator className="my-1" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BUSINESS_TYPES.map((type) => {
              const preset = INDUSTRY_PRESETS[type];
              const Icon = BUSINESS_TYPE_ICONS[type];
              const isSelected = selectedType === type;
              const isCurrent = type === currentBusinessType;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect(type)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : isCurrent
                        ? "border-muted-foreground/20 bg-muted/30"
                        : "border-border bg-background",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography.Text
                      className={cn(
                        "block text-sm font-medium",
                        isSelected && "text-primary",
                      )}
                    >
                      {bt(preset.labelKey)}
                    </Typography.Text>
                    <Typography.Muted className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {bt(preset.descriptionKey)}
                    </Typography.Muted>
                    {isCurrent && !isSelected && (
                      <Typography.Muted className="mt-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                        {t("current")}
                      </Typography.Muted>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setSelectedType(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedType || updateBusinessType.isPending}
            >
              {updateBusinessType.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {t("save")}
            </Button>
          </div>
        </>
      )}

      {!isEditing && isCurrentlySet && (
        <div className="mt-2 flex items-center gap-2">
          <Typography.Muted className="text-xs text-muted-foreground">
            {t("currentBusinessType")}:{" "}
          </Typography.Muted>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            {bt(
              INDUSTRY_PRESETS[currentBusinessType as BusinessType]?.labelKey ??
                "businessType.generalRepair",
            )}
          </span>
        </div>
      )}

      {!isEditing && !isCurrentlySet && (
        <Typography.Muted className="mt-2 text-xs text-muted-foreground">
          {t("noBusinessTypeSet")}
        </Typography.Muted>
      )}

      <SettingsRow
        label={t("partSuggestions")}
        description={t("partSuggestionsDesc")}
      >
        <Switch
          checked={partSuggestionsEnabled}
          onCheckedChange={(checked) => updatePartSuggestions.mutate(checked)}
          disabled={updatePartSuggestions.isPending}
        />
      </SettingsRow>
    </SettingsBlock>
  );
}
