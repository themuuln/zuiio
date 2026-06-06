"use client";

import { Loader2, Package, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import type { PartsCatalogItem, WorkOrderPart } from "@/lib/types";

// Extended type for catalog items that may come from global or org catalog
type CatalogPartItem = PartsCatalogItem & { _source?: "org" | "global" };

import { Typography } from "@/components/ui/typography";
import { formatMNT } from "@/lib/utils";

interface PartsSectionProps {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  lowStockMap?: Record<string, { quantity: number; threshold: number }>;
  partSearch: string;
  newPartName: string;
  newPartQty: number;
  newPartPrice: number;
  showAddPart: boolean;
  addingPart: boolean;
  pendingPartPreview: {
    name: string;
    quantity: number;
    unitPrice: number;
  } | null;
  editingPriceId: string | null;
  editingPriceVal: string;
  onPartSearchChange: (val: string) => void;
  onNewPartNameChange: (val: string) => void;
  onNewPartQtyChange: (val: number) => void;
  onNewPartPriceChange: (val: number) => void;
  onToggleAddPart: () => void;
  onAddPart: () => Promise<void>;
  onRemovePart: (partId: string) => Promise<void>;
  onEditPriceStart: (id: string, val: string) => void;
  onEditPriceChange: (val: string) => void;
  onEditPriceSave: (id: string) => Promise<void>;
  onEditPriceCancel: () => void;
  t: (key: string) => string;
}

export function PartsSection({
  parts,
  partsCatalog,
  lowStockMap,
  partSearch,
  newPartName,
  newPartQty,
  newPartPrice,
  showAddPart,
  addingPart,
  pendingPartPreview,
  editingPriceId,
  editingPriceVal,
  onPartSearchChange,
  onNewPartNameChange,
  onNewPartQtyChange,
  onNewPartPriceChange,
  onToggleAddPart,
  onAddPart,
  onRemovePart,
  onEditPriceStart,
  onEditPriceChange,
  onEditPriceSave,
  onEditPriceCancel,
  t,
}: PartsSectionProps) {
  const locale = useLocale();
  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-5 rounded-md bg-primary/10">
            <span className="text-xs font-semibold text-primary">P</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("parts")}
          </span>
          {(parts?.length ?? 0) > 0 && (
            <Badge variant="outline">{parts?.length}</Badge>
          )}
        </div>
      </div>

      {/* Parts list */}
      {(parts ?? []).length === 0 && !pendingPartPreview ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <Package className="size-4 text-muted-foreground/40 mb-2" />
          <span className="text-xs text-muted-foreground">
            {t("noPartsYet")}
          </span>
        </div>
      ) : (
        <div className="-mx-1">
          {/* Header row */}
          <div className="flex items-center gap-2 px-1 mb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            <div className="flex-1">{t("part")}</div>
            <div className="w-14 text-right">{t("qty")}</div>
            <div className="w-20 text-right">{t("total")}</div>
            <div className="w-7" />
          </div>
          <div className="flex flex-col gap-px">
            {parts?.map((part) => {
              const lowInfo = part.part_id
                ? lowStockMap?.[part.part_id]
                : undefined;
              return (
                <div
                  key={part.id}
                  className="group flex items-center gap-2 rounded-md p-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Typography.Text className="text-sm font-medium truncate">
                      {part.part_name}
                    </Typography.Text>
                    <Typography.Muted className="text-xs text-muted-foreground/60">
                      {formatMNT(Number(part.unit_price))}
                      {t("perUnit")}
                    </Typography.Muted>
                    {lowInfo && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <TriangleAlert className="size-3 shrink-0" />
                        Low stock: {lowInfo.quantity} remaining
                      </span>
                    )}
                  </div>
                  <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                    {part.quantity}
                  </div>
                  <div className="w-20 text-right">
                    {editingPriceId === part.id ? (
                      <Input
                        type="number"
                        className="w-20 h-7 text-right text-xs font-semibold tabular-nums rounded-sm border-primary/60 bg-background px-1 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={editingPriceVal}
                        onChange={(e) =>
                          onEditPriceChange(
                            e.target.value.replace(/^0+(?=\d)/, ""),
                          )
                        }
                        onBlur={() => onEditPriceSave(part.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onEditPriceSave(part.id);
                          if (e.key === "Escape") onEditPriceCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onEditPriceStart(
                            part.id,
                            String(Number(part.final_price)),
                          );
                        }}
                        className="font-semibold tabular-nums h-auto px-1 -mx-1 rounded-sm hover:underline hover:decoration-dashed hover:underline-offset-2"
                      >
                        {formatMNT(Number(part.final_price))}
                      </Button>
                    )}
                  </div>
                  <div className="w-7 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemovePart(part.id)}
                      className="text-destructive/60 hover:text-destructive size-6 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                      aria-label="Remove part"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {pendingPartPreview && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
                <div className="flex-1 min-w-0">
                  <Typography.Text className="text-sm font-medium truncate">
                    {pendingPartPreview.name}
                  </Typography.Text>
                  <Typography.Text className="text-xs text-amber-700 dark:text-amber-400">
                    Adding part...
                  </Typography.Text>
                </div>
                <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                  {pendingPartPreview.quantity}
                </div>
                <div className="w-20 text-right text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatMNT(
                    pendingPartPreview.quantity * pendingPartPreview.unitPrice,
                  )}
                </div>
                <div className="w-7 flex justify-center">
                  <Loader2 className="size-3 animate-spin text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add part form */}
      {showAddPart && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2 relative">
          <Input
            value={newPartName}
            onChange={(e) => {
              onNewPartNameChange(e.target.value);
              onPartSearchChange(e.target.value);
            }}
            placeholder={t("partName")}
            className="h-8 text-xs"
            autoFocus
            disabled={addingPart}
          />
          {partSearch && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-lg bg-background shadow-lg max-h-40 overflow-y-auto">
              {partsCatalog
                .filter((p) => {
                  const q = partSearch.toLowerCase();
                  const matchName = p.name.toLowerCase().includes(q);
                  const matchNameMn =
                    p.name_mn?.toLowerCase().includes(q) ?? false;
                  const matchPartNumber =
                    p.part_number?.toLowerCase().includes(q) ?? false;
                  return matchName || matchNameMn || matchPartNumber;
                })
                .slice(0, 8)
                .map((part) => {
                  const lowInfo = lowStockMap?.[part.id];
                  return (
                    <Button
                      variant="ghost"
                      key={part.id}
                      onClick={() => {
                        onNewPartNameChange(part.name);
                        onNewPartPriceChange(Number(part.default_price ?? 0));
                        onPartSearchChange("");
                      }}
                      className="w-full justify-start px-3 py-2 text-xs h-auto text-left"
                    >
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium truncate w-full">
                          {locale === "mn" && part.name_mn
                            ? part.name_mn
                            : part.name}
                        </span>
                        {part.part_number && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {part.part_number}
                          </span>
                        )}
                        {lowInfo && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <TriangleAlert className="size-3 shrink-0" />
                            Low stock: {lowInfo.quantity} remaining
                          </span>
                        )}
                      </div>
                      <span className="tabular-nums font-medium shrink-0 ml-auto text-muted-foreground group-hover/button:text-foreground">
                        {formatMNT(Number(part.default_price ?? 0))}
                      </span>
                    </Button>
                  );
                })}
              {partsCatalog.filter((p) => {
                const q = partSearch.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchNameMn =
                  p.name_mn?.toLowerCase().includes(q) ?? false;
                const matchPartNumber =
                  p.part_number?.toLowerCase().includes(q) ?? false;
                return matchName || matchNameMn || matchPartNumber;
              }).length === 0 && (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  No parts match
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              value={newPartQty}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onNewPartQtyChange(0);
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) onNewPartQtyChange(n);
              }}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (Number.isNaN(n) || n < 1) onNewPartQtyChange(1);
              }}
              placeholder={t("qty")}
              className="h-8 w-14 text-center text-xs"
            />
            <Input
              type="number"
              value={newPartPrice || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onNewPartPriceChange(0);
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) onNewPartPriceChange(n);
              }}
              placeholder={t("unitPrice")}
              className="h-8 flex-1 text-xs"
            />
            <Button
              size="sm"
              onClick={onAddPart}
              disabled={!newPartName.trim() || addingPart}
              className="h-8 px-2 text-xs"
            >
              {addingPart ? <Loader2 className="size-3 animate-spin" /> : "Add"}
            </Button>
          </div>
        </div>
      )}

      {/* Full-width Add button */}
      <Button
        variant="outline"
        onClick={onToggleAddPart}
        className="mt-2 w-full border-dashed text-xs h-9 gap-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200"
      >
        <Plus className="size-4" />
        {t("addPart")}
      </Button>
    </section>
  );
}
