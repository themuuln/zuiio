"use client";

import { Check } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  useProductVariants,
  useVariantGroups,
} from "@/lib/query/hooks/use-product-variants";
import { cn } from "@/lib/utils";

export type SelectedVariant = {
  variant_id: string;
  option_labels: string;
  option_ids: string[];
  sale_price: number | null;
  current_stock: number | null;
  image_url: string | null;
};

export function VariantPicker({
  productId,
  onSelect,
  onHasVariants,
}: {
  productId: string;
  onSelect: (variant: SelectedVariant | null) => void;
  onHasVariants?: (hasVariants: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy-load: only fetch variant data when the picker is visible
  const observe = useCallback(() => {
    if (enabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    return observe();
  }, [observe]);

  const { data: groups } = useVariantGroups(enabled ? productId : undefined);
  const { data: variants } = useProductVariants(
    enabled ? productId : undefined,
  );

  // Build selection state: group_id -> option_id
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Notify parent whether this product has variants
  useEffect(() => {
    onHasVariants?.(!!groups && groups.length > 0);
  }, [groups, onHasVariants]);

  // Find matching variant by comparing selected option IDs to each variant's option_ids
  const matchedVariant = useMemo(() => {
    if (!variants || !groups || groups.length === 0) return null;
    const selectedOptionIds = Object.values(selections).filter(Boolean);
    if (selectedOptionIds.length !== groups.length) return null;

    return (
      variants.find((v) => {
        if (!v.is_active) return false;
        const sorted = [...v.option_ids].sort();
        const selected = [...selectedOptionIds].sort();
        return (
          sorted.length === selected.length &&
          sorted.every((id, i) => id === selected[i])
        );
      }) ?? null
    );
  }, [variants, selections, groups]);

  // Notify parent when selection changes
  useEffect(() => {
    if (matchedVariant) {
      onSelect({
        variant_id: matchedVariant.id,
        option_labels: matchedVariant.option_labels,
        option_ids: matchedVariant.option_ids,
        sale_price: matchedVariant.sale_price,
        current_stock: matchedVariant.current_stock,
        image_url: matchedVariant.image_urls?.[0] ?? null,
      });
    } else if (Object.values(selections).some(Boolean)) {
      onSelect(null);
    }
  }, [matchedVariant, onSelect, selections]);

  // Don't render anything until near viewport
  if (!enabled) return <div ref={ref} className="h-0" />;

  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map((option) => {
              const isSelected = selections[group.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelections((prev) => ({
                      ...prev,
                      [group.id]: prev[group.id] === option.id ? "" : option.id,
                    }));
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {matchedVariant && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
          <Check className="size-3.5 text-primary" weight="bold" />
          <span className="font-medium">{matchedVariant.option_labels}</span>
          <span className="ml-auto font-semibold">
            {formatCurrency(Number(matchedVariant.sale_price ?? 0))}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {matchedVariant.current_stock ?? 0} ширхэг
          </Badge>
        </div>
      )}

      {!matchedVariant && Object.values(selections).some(Boolean) && (
        <p className="text-xs text-destructive">
          Сонгосон вариантын бүрдэл олдсонгүй
        </p>
      )}
    </div>
  );
}
