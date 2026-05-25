"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import type { WorkOrderPart } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

interface PartsSectionProps {
  parts: WorkOrderPart[];
  newPartName: string;
  newPartQty: number;
  newPartPrice: number;
  showAddPart: boolean;
  addingPart: boolean;
  pendingPartPreview: { name: string; quantity: number; unitPrice: number } | null;
  editingPriceId: string | null;
  editingPriceVal: string;
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
  newPartName,
  newPartQty,
  newPartPrice,
  showAddPart,
  addingPart,
  pendingPartPreview,
  editingPriceId,
  editingPriceVal,
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
  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center size-5 rounded-md bg-amber-500/10">
            <span className="text-[10px] font-semibold text-amber-600">
              P
            </span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("parts")}
          </span>
          {(parts?.length ?? 0) > 0 && (
            <Badge variant="outline">
              {parts?.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Parts list */}
      {(parts ?? []).length === 0 &&
      !pendingPartPreview ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("noPartsYet")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="-mx-0.5">
          {/* Header row */}
          <div className="flex items-center gap-2 px-1 mb-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            <div className="flex-1">{t("part")}</div>
            <div className="w-14 text-right">{t("qty")}</div>
            <div className="w-20 text-right">
              {t("total")}
            </div>
            <div className="w-7" />
          </div>
          <div className="flex flex-col gap-px">
            {parts?.map((part) => (
              <div
                key={part.id}
                className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {part.part_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatMNT(Number(part.unit_price))}
                    {t("perUnit")}
                  </p>
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
                        onEditPriceChange(e.target.value)
                      }
                      onBlur={() =>
                        onEditPriceSave(part.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          onEditPriceSave(part.id);
                        if (e.key === "Escape")
                          onEditPriceCancel();
                      }}
                      autoFocus
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onEditPriceStart(part.id, String(Number(part.final_price)));
                      }}
                      className="font-semibold tabular-nums h-auto px-1 -mx-1 rounded-sm"
                    >
                      {formatMNT(Number(part.final_price))}
                    </Button>
                  )}
                </div>
                <div className="w-7 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePart(part.id)}
                    className="text-destructive/60 hover:text-destructive size-6 opacity-0 group-hover:opacity-100"
                    aria-label="Remove part"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingPartPreview && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 p-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {pendingPartPreview.name}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Adding part...
                  </p>
                </div>
                <div className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                  {pendingPartPreview.quantity}
                </div>
                <div className="w-20 text-right text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatMNT(
                    pendingPartPreview.quantity *
                      pendingPartPreview.unitPrice,
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
        <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-2">
          <Input
            value={newPartName}
            onChange={(e) => onNewPartNameChange(e.target.value)}
            placeholder={t("partName")}
            className="h-8 text-xs"
            autoFocus
            disabled={addingPart}
          />
          <div className="flex gap-1.5">
            <Input
              type="number"
              value={newPartQty}
              onChange={(e) =>
                onNewPartQtyChange(Number(e.target.value) || 1)
              }
              placeholder={t("qty")}
              className="h-8 w-14 text-center text-xs"
              disabled={addingPart}
            />
            <Input
              type="number"
              value={newPartPrice || ""}
              onChange={(e) =>
                onNewPartPriceChange(Number(e.target.value) || 0)
              }
              placeholder={t("unitPrice")}
              className="h-8 flex-1 text-xs"
              disabled={addingPart}
            />
            <Button
              size="sm"
              onClick={onAddPart}
              disabled={!newPartName.trim() || addingPart}
              className="h-8 px-2 text-xs"
            >
              {addingPart ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Full-width Add button */}
      <Button
        variant="outline"
        onClick={onToggleAddPart}
        disabled={addingPart}
        className="mt-2 w-full border-dashed py-2 text-xs"
      >
        {addingPart ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {addingPart ? "Adding part..." : t("addPart")}
      </Button>
    </section>
  );
}
