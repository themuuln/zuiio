"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { cn, formatMNT } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(false);
  const hasDiscount = discountTotal > 0;
  const hasTax = taxRate > 0;
  const hasAdjustments = hasDiscount || hasTax;
  const taxAmount = Math.round(grandTotal * taxRate) / 100;
  const totalToPay = grandTotal - discountTotal + taxAmount;

  return (
    <section className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10">
      {/* Always-visible grand total row — clickable toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold leading-tight"
      >
        <span>{t("grandTotal")}</span>
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums text-primary">
            {formatMNT(hasAdjustments ? totalToPay : grandTotal)}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* Collapsible breakdown */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 px-3 pb-2">
            <Separator className="bg-primary/10" />
            <div className="flex justify-between text-xs leading-tight">
              <span className="text-muted-foreground">{t("services")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs leading-tight">
              <span className="text-muted-foreground">{t("parts")}</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsTotal)}
              </span>
            </div>
            <Separator className="bg-primary/10" />
            <div className="flex justify-between text-xs font-medium leading-tight">
              <span className="text-muted-foreground">{t("grandTotal")}</span>
              <span className="tabular-nums">{formatMNT(grandTotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-xs leading-tight text-destructive/80">
                <span>{t("discount")}</span>
                <span className="tabular-nums">
                  -{formatMNT(discountTotal)}
                </span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between text-xs leading-tight text-muted-foreground">
                <span>
                  {t("tax")} ({taxRate}%)
                </span>
                <span className="tabular-nums">{formatMNT(taxAmount)}</span>
              </div>
            )}
            {hasAdjustments && (
              <>
                <Separator className="bg-primary/10" />
                <div className="flex justify-between text-xs font-semibold leading-tight">
                  <span>{t("totalToPay")}</span>
                  <span className="tabular-nums text-primary">
                    {formatMNT(totalToPay)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
