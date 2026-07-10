"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { useItemVariants } from "@/lib/queries/use-catalog-variants";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { cn, formatMNT } from "@/lib/utils";

export interface VariantSelection {
  /** The selected variant id, or null if no variant selected */
  variantId: string | null;
  /** The computed price based on selection */
  price: number;
  /** Human-readable label for the selection */
  label: string;
}

interface VariantPickerProps {
  entityType: "service" | "part";
  entityId: string;
  entityName: string;
  defaultPrice: number;
  value: VariantSelection | null;
  onChange: (selection: VariantSelection | null) => void;
  /** If true, the picker shows in a compact form (inline within a row) */
  compact?: boolean;
}

/**
 * Variant Picker — displays dimension options as interactive chips/buttons
 * and computes the price as the user makes selections.
 *
 * For single-dimension variants (e.g. just "Size"), shows radio-style chip buttons.
 * For multi-dimension variants, shows grouped chips per dimension.
 *
 * When a variant exactly matches the user's selections, shows its specific price.
 * Otherwise shows the default price.
 */
export function VariantPicker({
  entityType,
  entityId,
  entityName,
  defaultPrice,
  value,
  onChange,
  compact,
}: VariantPickerProps) {
  const t = useTranslations("services");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: variants = [],
    isLoading,
    isError,
  } = useItemVariants(orgId, entityType, entityId);

  // ── Organize variants by dimension ──
  const dimensionMap = useMemo(() => {
    const dims = new Map<string, Set<string>>();
    for (const v of variants) {
      const vd = v.variant_data as unknown as Record<string, string>;
      for (const [key, val] of Object.entries(vd)) {
        if (!dims.has(key)) dims.set(key, new Set());
        dims.get(key)?.add(val);
      }
    }
    return Array.from(dims.entries()).map(([name, values]) => ({
      name,
      options: Array.from(values).sort(),
    }));
  }, [variants]);

  // ── Parse current selection ──
  const currentVariantData = useMemo(() => {
    if (!value?.variantId) return null;
    const match = variants.find((v) => v.id === value.variantId);
    if (!match) return null;
    return {
      variantData: match.variant_data as unknown as Record<string, string>,
      price: match.price ?? defaultPrice,
      label: match.variant_label,
      variantId: match.id,
    };
  }, [value, variants, defaultPrice]);

  // ── Current selections per dimension ──
  const selections = useMemo(() => {
    const map: Record<string, string> = {};
    if (currentVariantData) {
      Object.assign(map, currentVariantData.variantData);
    }
    return map;
  }, [currentVariantData]);

  // ── Find matching variant for current selections ──
  const matchingVariant = useMemo(() => {
    if (Object.keys(selections).length === 0) return null;
    return variants.find((v) => {
      const vd = v.variant_data as unknown as Record<string, string>;
      if (Object.keys(vd).length !== Object.keys(selections).length)
        return false;
      for (const [key, val] of Object.entries(selections)) {
        if (vd[key] !== val) return false;
      }
      return true;
    });
  }, [selections, variants]);

  const resolvedPrice = matchingVariant?.price ?? defaultPrice;
  const resolvedLabel =
    matchingVariant?.variant_label ??
    Object.values(selections).join(" + ") ??
    entityName;

  const handleSelectOption = (dimName: string, option: string) => {
    const next = { ...selections, [dimName]: option };

    // Toggle off if same option clicked again
    if (selections[dimName] === option) {
      delete next[dimName];
    }

    // Find matching variant
    const match = variants.find((v) => {
      const vd = v.variant_data as unknown as Record<string, string>;
      if (Object.keys(vd).length !== Object.keys(next).length) return false;
      for (const [key, val] of Object.entries(next)) {
        if (vd[key] !== val) return false;
      }
      return true;
    });

    if (match) {
      onChange({
        variantId: match.id,
        price: match.price ?? defaultPrice,
        label: match.variant_label,
      });
    } else if (Object.keys(next).length > 0) {
      // Partial selection — no exact match, show computed price
      onChange({
        variantId: null,
        price: defaultPrice,
        label: Object.values(next).join(" + "),
      });
    } else {
      onChange(null);
    }
  };

  // ── No variants available ──
  if (!isLoading && variants.length === 0) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <Typography.Muted className="text-xs">
          {t("loadingVariants")}
        </Typography.Muted>
      </div>
    );
  }

  if (isError) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {variants.slice(0, 5).map((v) => {
          const isSelected = value?.variantId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                onChange(
                  isSelected
                    ? null
                    : {
                        variantId: v.id,
                        price: v.price ?? defaultPrice,
                        label: v.variant_label,
                      },
                )
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground/30",
              )}
            >
              {isSelected && <Check className="size-3" />}
              {v.variant_label}
              <span className="tabular-nums opacity-70">
                {formatMNT(v.price ?? defaultPrice)}
              </span>
            </button>
          );
        })}
        {variants.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{variants.length - 5}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dimensionMap.map((dim) => (
        <div key={dim.name}>
          <Typography.Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            {dim.name}
          </Typography.Text>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {dim.options.map((option) => {
              const isSelected = selections[dim.name] === option;
              return (
                // biome-ignore lint/a11y/useSemanticElements: custom radio picker with color swatches, native input would lose visual design
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(dim.name, option)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-200",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && <Check className="size-2.5" />}
                  </div>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Price Preview ── */}
      {Object.keys(selections).length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex flex-col">
            <Typography.Text className="text-sm font-medium">
              {resolvedLabel}
            </Typography.Text>
            {matchingVariant ? (
              <Typography.Muted className="text-xs text-primary/70">
                {t("matchingVariant")}
              </Typography.Muted>
            ) : (
              <Typography.Muted className="text-xs text-muted-foreground/60">
                {t("defaultPriceUsed")}
              </Typography.Muted>
            )}
          </div>
          <Typography.Text className="text-lg font-semibold tabular-nums">
            {formatMNT(resolvedPrice)}
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
