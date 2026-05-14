"use client";

import { Check, Clock, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWizardContext } from "./wizard-context";

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PartsSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("parts")}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={ctx.addPart}
          className="min-h-[44px]"
        >
          <Plus className="size-4" /> {t("addPart")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* From last visit parts */}
        {ctx.showLastVisitSuggestions &&
          (ctx.lastVisitData?.parts.length ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {t("fromLastVisitParts")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto h-9 min-h-[36px]"
                  onClick={ctx.addAllFromLastVisit}
                >
                  <Check className="size-3.5 mr-1" />
                  {t("addAll")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ctx.lastVisitData?.parts.map((part, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      ctx.setPartLines((prev) => [
                        ...prev,
                        {
                          part_name: part.part_name,
                          part_number: part.part_number ?? "",
                          quantity: part.quantity,
                          unit_price: part.unit_price,
                          final_price: part.unit_price * part.quantity,
                          last_price: part.unit_price,
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm transition-colors hover:bg-amber-50 min-h-[44px] dark:border-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
                  >
                    <span className="font-medium">{part.part_name}</span>
                    <span className="text-muted-foreground">
                      {formatMNT(part.unit_price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {ctx.partLines.length === 0 && !ctx.showLastVisitSuggestions ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {t("noPartsAdded")}
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {ctx.partLines.map((part, idx) => {
                const partLast = part.part_name
                  ? ctx.partHistory[part.part_name.toLowerCase()]
                  : undefined;
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 p-3 hover:bg-muted/20"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <Input
                        value={part.part_name}
                        onChange={(e) =>
                          ctx.updatePart(idx, "part_name", e.target.value)
                        }
                        className="h-11"
                        placeholder={t("partName")}
                        aria-label="Part name"
                      />
                      {partLast && (
                        <p className="mt-1 text-[11px] text-amber-600">
                          {t("lastSoldShort", { price: formatMNT(partLast) })}
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={part.quantity}
                      onChange={(e) =>
                        ctx.updatePart(
                          idx,
                          "quantity",
                          parseInt(e.target.value, 10) || 1,
                        )
                      }
                      className="w-16 h-11 text-center"
                      min={1}
                      aria-label="Quantity"
                    />
                    <Input
                      type="number"
                      value={part.unit_price || ""}
                      onChange={(e) =>
                        ctx.updatePart(
                          idx,
                          "unit_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-28 h-11"
                      aria-label="Unit price"
                    />
                    <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                      {formatMNT(part.final_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => ctx.removePart(idx)}
                      className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Remove part"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
