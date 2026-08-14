"use client";

import { Package, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { formatCurrency } from "@/lib/utils";

export interface PartLine {
  part_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  final_price: number;
  last_price?: number;
}

interface PartLinesProps {
  lines: PartLine[];
  onAdd: () => void;
  onUpdate: (
    idx: number,
    field: keyof PartLine,
    value: string | number,
  ) => void;
  onRemove: (idx: number) => void;
}

export function PartLines({
  lines,
  onAdd,
  onUpdate,
  onRemove,
}: PartLinesProps) {
  const t = useTranslations("workOrderDetail");
  const tc = useTranslations("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="size-4" />
          {t("parts")}
          {lines.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {t("partCount", { count: lines.length })}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {lines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {lines.map((part, idx) => (
                <div
                  key={part.part_number ?? `part-${idx}`}
                  className="flex items-center gap-2 p-3 hover:bg-muted/20"
                >
                  <Input
                    placeholder={t("partNamePlaceholder")}
                    value={part.part_name}
                    onChange={(e) => onUpdate(idx, "part_name", e.target.value)}
                    className="flex-1 h-10 min-w-[120px]"
                  />
                  <Input
                    placeholder={t("partNumberPlaceholder")}
                    value={part.part_number}
                    onChange={(e) =>
                      onUpdate(idx, "part_number", e.target.value)
                    }
                    className="w-24 h-10"
                  />
                  <NumericInput
                    value={part.quantity}
                    onChange={(qty) =>
                      onUpdate(idx, "quantity", Math.max(1, Math.round(qty)))
                    }
                    min={1}
                    size="md"
                    align="center"
                    className="w-14"
                    aria-label={tc("quantity")}
                  />
                  <CurrencyInput
                    value={part.unit_price}
                    onChange={(price) => onUpdate(idx, "unit_price", price)}
                    size="md"
                    className="w-20"
                    aria-label={tc("unitPrice")}
                  />
                  <span className="text-sm font-semibold tabular-nums w-20 text-right">
                    {formatCurrency(part.final_price)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemove(idx)}
                    className="shrink-0 min-w-[44px] min-h-[var(--ui-touch-target)]"
                    aria-label={t("removeItem", {
                      name: part.part_name || "part",
                    })}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="self-start min-h-[var(--ui-touch-target)]"
        >
          <Plus className="size-4" />
          {t("addPart")}
        </Button>
      </CardContent>
    </Card>
  );
}
