"use client";

import { Check, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  onActionLabelChange,
  dialogMode = false,
}: {
  productId: string;
  onSelect: (variant: SelectedVariant | null) => void;
  onHasVariants?: (hasVariants: boolean) => void;
  onActionLabelChange?: (label: string | null) => void;
  dialogMode?: boolean;
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
  const { data: variants, isPending: isVariantsLoading } = useProductVariants(
    enabled ? productId : undefined,
  );

  // Build selection state: group_id -> option_id
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!productId) {
      setSelections({});
      return;
    }

    setSelections({});
  }, [productId]);

  // Notify parent whether this product has variants
  useEffect(() => {
    onHasVariants?.(!!groups && groups.length > 0);
  }, [groups, onHasVariants]);

  const selectedOptionIds = useMemo(
    () => Object.values(selections).filter(Boolean),
    [selections],
  );
  const selectedCount = selectedOptionIds.length;

  const activeVariants = useMemo(
    () => variants?.filter((variant) => variant.is_active) ?? [],
    [variants],
  );

  const availabilityByOption = useMemo<Record<string, boolean>>(() => {
    const availability: Record<string, boolean> = {};
    if (!groups || !variants) return availability;

    for (const group of groups) {
      for (const option of group.options) {
        const nextSelections = { ...selections, [group.id]: option.id };
        const requiredOptionIds = Object.values(nextSelections).filter(Boolean);
        availability[option.id] = activeVariants.some((variant) =>
          requiredOptionIds.every((id) => variant.option_ids.includes(id)),
        );
      }
    }

    return availability;
  }, [activeVariants, groups, selections, variants]);
  // Sum current_stock across all active variants that include each option
  const stockByOption = useMemo<Record<string, number>>(() => {
    const stock: Record<string, number> = {};
    if (!groups || !variants) return stock;

    for (const group of groups) {
      for (const option of group.options) {
        stock[option.id] = activeVariants
          .filter((variant) => variant.option_ids.includes(option.id))
          .reduce((sum, variant) => sum + (variant.current_stock ?? 0), 0);
      }
    }

    return stock;
  }, [activeVariants, groups, variants]);

  // Keep only selections that still lead to at least one active variant
  useEffect(() => {
    if (!groups || activeVariants.length === 0) return;

    setSelections((prev) => {
      const nextSelections: Record<string, string> = {};

      for (const group of groups) {
        const selectedOptionId = prev[group.id];
        if (!selectedOptionId) continue;
        if (availabilityByOption[selectedOptionId] ?? true) {
          nextSelections[group.id] = selectedOptionId;
        }
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextSelections);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === nextSelections[key])
      ) {
        return prev;
      }

      return nextSelections;
    });
  }, [activeVariants.length, availabilityByOption, groups]);

  // Find matching variant by comparing selected option IDs to each variant's option_ids
  const matchedVariant = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    if (selectedOptionIds.length !== groups.length) return null;

    return (
      activeVariants.find((variant) => {
        const sorted = [...variant.option_ids].sort();
        const selected = [...selectedOptionIds].sort();
        return (
          sorted.length === selected.length &&
          sorted.every((id, i) => id === selected[i])
        );
      }) ?? null
    );
  }, [activeVariants, selectedOptionIds, groups]);

  const isCompleteSelection = !!groups && selectedCount === groups.length;
  const nextGroup = groups?.find((group) => !selections[group.id]);

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
      return;
    }

    onSelect(null);
  }, [matchedVariant, onSelect]);

  useEffect(() => {
    if (!groups || groups.length === 0) {
      onActionLabelChange?.(null);
      return;
    }

    if (matchedVariant) {
      onActionLabelChange?.("Сагсанд хийх");
      return;
    }

    if (nextGroup) {
      onActionLabelChange?.(`${nextGroup.name} сонгох`);
      return;
    }

    onActionLabelChange?.("Сонголтоо засах");
  }, [groups, matchedVariant, nextGroup, onActionLabelChange]);

  // Don't render anything until near viewport
  if (!enabled) return <div ref={ref} className="h-0" />;

  // Dialog mode: flat chip layout for use inside modals/drawers
  if (dialogMode) {
    return (
      <div className="space-y-5">
        {groups?.map((group) => {
          const selectedOption = group.options.find(
            (option) => selections[group.id] === option.id,
          );

          return (
            <div key={group.id}>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {group.name}
                </p>
                {selectedOption && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {selectedOption.value}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isSelected = selections[group.id] === option.id;
                  const isAvailable = availabilityByOption[option.id] ?? true;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!isAvailable && !isSelected}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 aria-pressed:border-primary/30 aria-pressed:bg-primary/10 aria-pressed:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() =>
                        setSelections((prev) => ({
                          ...prev,
                          [group.id]: option.id,
                        }))
                      }
                    >
                      {isSelected && (
                        <Check
                          className="size-3.5 shrink-0 text-primary"
                          weight="bold"
                          aria-hidden="true"
                        />
                      )}
                      <span className={cn(!isAvailable && "line-through")}>
                        {option.value}
                      </span>
                      {isAvailable && !isSelected && (
                        <span className="ml-0.5 text-[11px] text-muted-foreground/70">
                          {isVariantsLoading ? (
                            <Skeleton className="inline-block h-[11px] w-7 rounded-sm" />
                          ) : (
                            `${stockByOption[option.id] ?? 0} ш`
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Matched variant summary */}
        {matchedVariant && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <CheckCircle
              className="size-5 shrink-0 text-primary"
              weight="fill"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Сонгосон хувилбар
              </p>
              <p className="text-xs text-muted-foreground">
                {matchedVariant.option_labels}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-base font-bold text-primary">
                  {formatCurrency(Number(matchedVariant.sale_price ?? 0))}
                </span>
                <Badge
                  variant="outline"
                  className="border-current/25 bg-background/70 text-[11px] text-muted-foreground"
                >
                  {matchedVariant.current_stock ?? 0} ш
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!groups) return <div ref={ref} className="h-0" />;

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold leading-none text-foreground">
              Вариант сонгох
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {matchedVariant
                ? "Сонголт бэлэн боллоо — сагсанд шууд хийж болно"
                : nextGroup
                  ? `${nextGroup.name} сонгоод дараагийн алхам руу орно`
                  : "Сонголтоо шалгаад тохирох хувилбар хайж байна"}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            {selectedCount}/{groups.length}
          </span>
        </div>

        <div className="space-y-1.5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-border/60"
            aria-hidden="true"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color]",
                matchedVariant
                  ? "bg-primary"
                  : isCompleteSelection
                    ? "bg-destructive/70"
                    : "bg-foreground/70",
              )}
              style={{
                width: `${Math.max((selectedCount / groups.length) * 100, 8)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="truncate">
              {matchedVariant
                ? matchedVariant.option_labels
                : nextGroup
                  ? `Дараагийн алхам: ${nextGroup.name}`
                  : "Сонголтоо өөрчлөөд дахин шалгана уу"}
            </span>
            <span className="shrink-0">
              {groups.length - selectedCount} үлдсэн
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {groups.map((group, groupIndex) => {
          const selectedOption = group.options.find(
            (option) => selections[group.id] === option.id,
          );
          const availableOptionsCount = group.options.filter(
            (option) => availabilityByOption[option.id] ?? true,
          ).length;
          const isCurrentStep = nextGroup?.id === group.id;
          const isCompletedStep = !!selectedOption;

          return (
            <div key={group.id} className="relative pl-6">
              {groupIndex < groups.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[9px] top-8 bottom-[-12px] w-px",
                    isCompletedStep ? "bg-primary/30" : "bg-border/70",
                  )}
                />
              )}

              <fieldset
                className={cn(
                  "rounded-xl border px-3 py-3 transition-colors",
                  isCompletedStep
                    ? "border-primary/20 bg-primary/5"
                    : isCurrentStep
                      ? "border-border/70 bg-background/90"
                      : "border-border/60 bg-background/75",
                )}
              >
                <legend className="sr-only">{group.name}</legend>

                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      isCompletedStep
                        ? "bg-primary text-primary-foreground"
                        : isCurrentStep
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompletedStep ? (
                      <Check className="size-3.5" weight="bold" />
                    ) : (
                      groupIndex + 1
                    )}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {group.name}
                        </p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {isCompletedStep
                            ? "Энэ алхам дууссан"
                            : isCurrentStep
                              ? "Эндээс нэгийг сонгоно уу"
                              : availableOptionsCount === 0
                                ? "Одоогийн сонголттой нийцэх хувилбар алга"
                                : `${availableOptionsCount} боломжтой сонголт байна`}
                        </p>
                      </div>

                      {selectedOption ? (
                        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {selectedOption.value}
                        </span>
                      ) : isCurrentStep ? (
                        <span className="shrink-0 text-[10px] font-medium text-primary">
                          Одоо
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const isSelected = selections[group.id] === option.id;
                    const isAvailable = availabilityByOption[option.id] ?? true;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-label={`${group.name}: ${option.value}${!isAvailable ? " боломжгүй" : ""}`}
                        aria-pressed={isSelected}
                        disabled={!isSelected && !isAvailable}
                        onClick={() => {
                          setSelections((prev) => ({
                            ...prev,
                            [group.id]:
                              prev[group.id] === option.id ? "" : option.id,
                          }));
                        }}
                        className={cn(
                          "flex min-h-14 min-w-0 items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100",
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground shadow-sm"
                            : isAvailable
                              ? "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/[0.03]"
                              : "border-border/60 bg-muted/35 text-muted-foreground/60",
                        )}
                      >
                        {isSelected ? (
                          <Check
                            className="size-3.5 shrink-0 text-primary"
                            weight="bold"
                          />
                        ) : isAvailable ? (
                          <span
                            aria-hidden="true"
                            className="size-3 shrink-0 rounded-full border border-border/70"
                          />
                        ) : (
                          <XCircle
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground/70"
                            weight="fill"
                          />
                        )}

                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            !isAvailable && "line-through",
                          )}
                        >
                          {option.value}
                        </span>
                        {isAvailable && !isSelected && (
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/70">
                            {isVariantsLoading ? (
                              <Skeleton className="inline-block h-[11px] w-7 rounded-sm" />
                            ) : (
                              `${stockByOption[option.id] ?? 0} ш`
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-3 flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-xs",
          matchedVariant
            ? "border-primary/20 bg-primary/10 text-primary"
            : isCompleteSelection
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-border/60 bg-background/70 text-muted-foreground",
        )}
      >
        {matchedVariant ? (
          <CheckCircle className="size-4 shrink-0" weight="fill" />
        ) : isCompleteSelection ? (
          <XCircle className="size-4 shrink-0" weight="fill" />
        ) : (
          <span className="size-1.5 shrink-0 rounded-full bg-current" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {matchedVariant
              ? "Сагсанд хийхэд бэлэн"
              : isCompleteSelection
                ? "Энэ бүрдэлд таарах вариант олдсонгүй"
                : nextGroup
                  ? `${nextGroup.name} сонгоод үргэлжлүүлнэ`
                  : "Вариант сонгож эхэлнэ үү"}
          </p>
          <p className="mt-0.5 text-[11px] opacity-80">
            {matchedVariant
              ? matchedVariant.option_labels
              : isCompleteSelection
                ? "Нэг эсвэл хэд хэдэн сонголтоо солиод дахин шалгана уу"
                : `${selectedCount}/${groups.length} алхам дууссан`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {matchedVariant && (
            <>
              <span className="shrink-0 font-semibold text-foreground">
                {formatCurrency(Number(matchedVariant.sale_price ?? 0))}
              </span>
              <Badge
                variant="outline"
                className="shrink-0 border-current/25 bg-background/70 text-[10px]"
              >
                {matchedVariant.current_stock ?? 0} ш
              </Badge>
            </>
          )}

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelections({})}
              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Цэвэрлэх
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
