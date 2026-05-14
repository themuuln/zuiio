"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWizardContext } from "./wizard-context";
import { useTranslations } from "next-intl";

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
        <Button variant="outline" size="sm" onClick={ctx.addPart}>
          <Plus className="size-4" /> {t("addPart")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ctx.partLines.length === 0 ? (
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
                  className="flex items-center gap-2 p-3 hover:bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <Input
                      value={part.part_name}
                      onChange={(e) => ctx.updatePart(idx, "part_name", e.target.value)}
                      className="h-10"
                      placeholder={t("partName")}
                      aria-label="Part name"
                    />
                    {partLast && (
                      <p className="mt-0.5 text-[11px] text-amber-600">
                        Last sold: {formatMNT(partLast)}
                      </p>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={part.quantity}
                    onChange={(e) =>
                      ctx.updatePart(idx, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 h-10 text-center"
                    min={1}
                    aria-label="Quantity"
                  />
                  <Input
                    type="number"
                    value={part.unit_price || ""}
                    onChange={(e) =>
                      ctx.updatePart(idx, "unit_price", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 h-10"
                    aria-label="Unit price"
                  />
                  <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                    {formatMNT(part.final_price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => ctx.removePart(idx)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                    aria-label="Remove part"
                  >
                    <Trash2 className="size-4" />
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
