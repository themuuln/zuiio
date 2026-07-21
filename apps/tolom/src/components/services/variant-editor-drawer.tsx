"use client";

import {
  Dices,
  GripVertical,
  Loader2,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import {
  useBulkGenerateVariants,
  useCreateVariantGroup,
  useCreateVariantOption,
  useDeleteItemVariant,
  useItemVariants,
  useUpdateItemVariant,
  useVariantGroups,
  useVariantOptions,
} from "@/lib/queries/use-catalog-variants";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { CatalogItemVariant } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

interface VariantEditorSheetProps {
  /** "service" or "part" */
  entityType: "service" | "part";
  entityId: string | null;
  entityName: string;
  defaultPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VariantEditorSheet({
  entityType,
  entityId,
  entityName,
  defaultPrice,
  open,
  onOpenChange,
}: VariantEditorSheetProps) {
  const t = useTranslations("services");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  // ── Data queries ──
  const { data: groups = [] } = useVariantGroups(orgId);
  const { data: variants = [], isLoading: variantsLoading } = useItemVariants(
    orgId,
    entityType,
    entityId ?? undefined,
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // ── Mutations ──
  const bulkGen = useBulkGenerateVariants(orgId);
  const deleteVariant = useDeleteItemVariant(orgId);
  const updateVariant = useUpdateItemVariant(orgId);
  const createGroup = useCreateVariantGroup(orgId);
  const createOption = useCreateVariantOption(orgId);

  const { data: groupOptions = [] } = useVariantOptions(
    orgId,
    selectedGroupId || undefined,
  );

  const handleAddDimension = () => {
    if (!selectedGroupId || selectedOptionIds.length === 0) return;
    // Generate variants based on selected group + options
    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const selectedLabels = groupOptions
      .filter((o) => selectedOptionIds.includes(o.id))
      .map((o) => o.label);

    // Create dimension_options for bulk generation
    const dimensionOptions: Record<string, string[]> = {};
    dimensionOptions[group.name] = selectedLabels;

    bulkGen.mutate({
      entity_type: entityType,
      entity_id: entityId!,
      dimension_options: dimensionOptions,
    });

    setSelectedGroupId("");
    setSelectedOptionIds([]);
  };

  const handlePriceChange = (variantId: string, value: string) => {
    const price = value ? parseFloat(value) : null;
    if (price != null && Number.isNaN(price)) return;
    updateVariant.mutate({ id: variantId, price });
  };

  const handleDeleteVariant = (variantId: string) => {
    deleteVariant.mutate(variantId);
  };

  const handleCreateGroup = () => {
    const name = prompt(t("variantGroupNamePrompt"));
    if (!name?.trim() || !orgId) return;
    createGroup.mutate({
      name: name.trim(),
      applies_to: entityType === "service" ? "service" : "part",
    });
  };

  const handleAddOption = (groupId: string) => {
    const label = prompt(t("variantOptionLabelPrompt"));
    if (!label?.trim() || !orgId) return;
    createOption.mutate({
      group_id: groupId,
      label: label.trim(),
    });
  };

  // ── Filter groups by applies_to ──
  const applicableGroups = useMemo(
    () =>
      groups.filter(
        (g) => g.applies_to === "both" || g.applies_to === entityType,
      ),
    [groups, entityType],
  );

  // ── Group variants into dimensions for display ──
  const variantGroups = useMemo(() => {
    const groupNames = new Set<string>();
    for (const v of variants) {
      const vd = v.variant_data as unknown as Record<string, string>;
      for (const key of Object.keys(vd)) {
        groupNames.add(key);
      }
    }
    return Array.from(groupNames);
  }, [variants]);

  // Build a matrix-like view: group 1D dimension -> variants with their prices
  const hasSingleDimension = variantGroups.length <= 1;

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header bordered={false}>
        <div className="flex items-center justify-between">
          <DrawerTitle>{t("manageVariants")}</DrawerTitle>
          <Badge variant="secondary" className="shrink-0">
            {variants.length} {t("variantCount", { count: String(variants.length) })}
          </Badge>
        </div>
        <DrawerDescription>
          {t("variantsFor")} <span className="font-medium">{entityName}</span>.
          {t("basePriceLabel")}{" "}
          <span className="font-medium tabular-nums">
            {formatMNT(defaultPrice)}
          </span>
        </DrawerDescription>
      </DetailDrawer.Header>

      {/* ── Add Dimension Bar ── */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
        <Typography.Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("addVariantDimension")}
        </Typography.Text>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <Select
              value={selectedGroupId}
              onValueChange={(val: string | null) => {
                if (val) {
                  setSelectedGroupId(val);
                  setSelectedOptionIds([]);
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("selectDimension")} />
              </SelectTrigger>
              <SelectContent>
                {applicableGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGroupId && (
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <div className="flex items-center gap-1 flex-wrap">
                {groupOptions
                  .filter((o) => selectedOptionIds.includes(o.id))
                  .map((o) => (
                    <Badge key={o.id} variant="secondary" className="gap-1">
                      {o.label}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedOptionIds((prev) =>
                            prev.filter((id) => id !== o.id),
                          )
                        }
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val && !selectedOptionIds.includes(val)) {
                      setSelectedOptionIds((prev) => [...prev, val]);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs border-dashed">
                    <SelectValue placeholder="+" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions
                      .filter((o) => !selectedOptionIds.includes(o.id))
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    <button
                      type="button"
                      onClick={() => handleAddOption(selectedGroupId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent cursor-pointer border-t border-border"
                    >
                      <Plus className="size-3.5" />
                      Add new option
                    </button>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button
            variant="default"
            size="sm"
            className="h-9"
            disabled={
              !selectedGroupId || selectedOptionIds.length === 0 || !entityId
            }
            onClick={handleAddDimension}
          >
            {bulkGen.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Dices className="size-4" />
            )}
            {t("generateVariants")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleCreateGroup}
          >
            <Plus className="size-4" />
            {t("newDimension")}
          </Button>
        </div>
      </div>

      {/* ── Variants List ── */}
      <DetailDrawer.Body className="flex flex-col gap-3">
        {variantsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Tag className="size-8 text-muted-foreground/40" />
            <Typography.Muted className="text-muted-foreground">
              {t("noVariants")}
            </Typography.Muted>
            <Typography.Muted className="text-xs text-muted-foreground/60">
              {t("addDimensionToStart")}
            </Typography.Muted>
          </div>
        ) : (
          <>
            {/* Simple list when single-dimension */}
            {hasSingleDimension
              ? variants.map((v) => (
                  <VariantRow
                    key={v.id}
                    variant={v}
                    defaultPrice={defaultPrice}
                    onPriceChange={handlePriceChange}
                    onDelete={handleDeleteVariant}
                    isSaving={
                      updateVariant.isPending || deleteVariant.isPending
                    }
                  />
                ))
              : // Grouped view for multi-dimension
                groupVariantsByDimension(variants).map(
                  ({ dimension, entries }) => (
                    <div key={dimension}>
                      <Typography.Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        {dimension}
                      </Typography.Text>
                      <div className="flex flex-col gap-1">
                        {entries.map((v) => (
                          <VariantRow
                            key={v.id}
                            variant={v}
                            defaultPrice={defaultPrice}
                            onPriceChange={handlePriceChange}
                            onDelete={handleDeleteVariant}
                            isSaving={
                              updateVariant.isPending || deleteVariant.isPending
                            }
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
          </>
        )}
      </DetailDrawer.Body>

      {/* ── Footer ── */}
      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions justify="end">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
          >
            {t("close")}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}

// ── Variant Row Sub-Component ──

function VariantRow({
  variant,
  defaultPrice,
  onPriceChange,
  onDelete,
  isSaving,
  compact,
}: {
  variant: CatalogItemVariant;
  defaultPrice: number;
  onPriceChange: (id: string, price: string) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  compact?: boolean;
}) {
  const vd = variant.variant_data as unknown as Record<string, string>;
  const dimDisplay = Object.entries(vd)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const currentPrice = variant.price ?? defaultPrice;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border transition-colors ${
        variant.price != null && variant.price !== defaultPrice
          ? "border-primary/40 bg-primary/5"
          : "border-border"
      } ${compact ? "p-2" : "p-3"}`}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground/30" />
      <div className="flex-1 min-w-0">
        <Typography.Text
          className={`font-medium truncate block ${compact ? "text-xs" : "text-sm"}`}
        >
          {variant.variant_label}
        </Typography.Text>
        {!compact && dimDisplay && (
          <Typography.Muted className="text-xs text-muted-foreground/60">
            {dimDisplay}
          </Typography.Muted>
        )}
      </div>
      <CurrencyInput
        min={0}
        key={`${variant.id}-${variant.price}`}
        value={currentPrice}
        onChange={(val) => onPriceChange(variant.id, String(val))}
        className={`h-8 w-24 tabular-nums ${
          variant.price != null && variant.price !== defaultPrice
            ? "border-primary"
            : ""
        }`}
        size="sm"
        autoSelect
      />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onDelete(variant.id)}
        disabled={isSaving}
        aria-label="Delete variant"
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}

// ── Utility ──

function groupVariantsByDimension(
  variants: CatalogItemVariant[],
): Array<{ dimension: string; entries: CatalogItemVariant[] }> {
  // Get the first dimension key for grouping
  const groups: Record<string, CatalogItemVariant[]> = {};
  for (const v of variants) {
    const vd = v.variant_data as unknown as Record<string, string>;
    const keys = Object.keys(vd);
    const firstKey = keys[0] ?? "Other";
    if (!groups[firstKey]) groups[firstKey] = [];
    groups[firstKey].push(v);
  }
  return Object.entries(groups).map(([dimension, entries]) => ({
    dimension,
    entries,
  }));
}
