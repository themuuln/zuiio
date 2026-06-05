"use client";

import { Separator } from "@/components/ui/separator";
import { formatMNT } from "@/lib/utils";

interface TotalsSummaryProps {
  servicesTotal: number;
  partsTotal: number;
  grandTotal: number;
  discountTotal?: number;
  taxRate?: number;
  t: (key: string) => string;
}

export function TotalsSummary({
  servicesTotal,
  partsTotal,
  grandTotal,
  discountTotal = 0,
  taxRate = 0,
  t,
}: TotalsSummaryProps) {
  const hasDiscount = discountTotal > 0;
  const hasTax = taxRate > 0;
  const hasAdjustments = hasDiscount || hasTax;
  const taxAmount = Math.round(grandTotal * taxRate) / 100;
  const totalToPay = grandTotal - discountTotal + taxAmount;

  return (
    <section className="shrink-0 rounded-lg bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 p-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("services")}</span>
          <span className="font-medium tabular-nums">
            {formatMNT(servicesTotal)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("parts")}</span>
          <span className="font-medium tabular-nums">
            {formatMNT(partsTotal)}
          </span>
        </div>
        <Separator className="bg-primary/10" />
        <div className="flex justify-between text-sm font-semibold">
          <span>{t("grandTotal")}</span>
          <span className="tabular-nums text-primary">
            {formatMNT(grandTotal)}
          </span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between text-xs text-destructive/80">
            <span>{t("discount")}</span>
            <span className="tabular-nums">
              -{formatMNT(discountTotal)}
            </span>
          </div>
        )}
        {hasTax && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {t("tax")} ({taxRate}%)
            </span>
            <span className="tabular-nums">
              {formatMNT(taxAmount)}
            </span>
          </div>
        )}
        {hasAdjustments && (
          <>
            <Separator className="bg-primary/10" />
            <div className="flex justify-between text-sm font-semibold">
              <span>{t("totalToPay")}</span>
              <span className="tabular-nums text-primary">
                {formatMNT(totalToPay)}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
