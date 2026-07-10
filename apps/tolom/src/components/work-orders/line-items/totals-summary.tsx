"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { cn, formatMNT } from "@/lib/utils";

export interface TotalsSummaryProps {
  servicesTotal: number;
  partsTotal: number;
  grandTotal: number;
  serviceCount?: number;
  partCount?: number;
  discountTotal?: number;
  taxRate?: number;
  nuatEnabled?: boolean;
  locale?: string;
  t: (key: string) => string;
}

export function TotalsSummary({
  servicesTotal,
  partsTotal,
  grandTotal,
  serviceCount,
  partCount,
  discountTotal = 0,
  taxRate = 0,
  nuatEnabled = false,
  locale = "mn",
  t,
}: TotalsSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDiscount = discountTotal > 0;
  const hasTax = nuatEnabled && taxRate > 0;
  const hasAdjustments = hasDiscount || hasTax;
  const taxAmount = hasTax ? Math.round(grandTotal * taxRate) / 100 : 0;
  const totalToPay = grandTotal - discountTotal + taxAmount;
  const taxLabel = locale === "mn" ? "НӨАТ" : "VAT";
  const hasItems = (serviceCount ?? 0) > 0 || (partCount ?? 0) > 0;

  return (
    <section className="rounded-lg">
      {/* Always-visible grand total row — clickable toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold leading-tight"
      >
        <span className="flex items-center gap-2">
          <span>{t("grandTotal")}</span>
          {hasItems && (
            <span className="text-[10px] font-normal text-muted-foreground/50 tabular-nums">
              {serviceCount != null && serviceCount > 0 && (
                <>
                  {serviceCount} {t("services")}
                </>
              )}
              {serviceCount != null &&
                serviceCount > 0 &&
                partCount != null &&
                partCount > 0 && <span> · </span>}
              {partCount != null && partCount > 0 && (
                <>
                  {partCount} {t("parts")}
                </>
              )}
            </span>
          )}
        </span>
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
              <span className="text-muted-foreground flex items-center gap-1.5">
                {t("services")}
                {serviceCount != null && (
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                    ({serviceCount})
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs leading-tight">
              <span className="text-muted-foreground flex items-center gap-1.5">
                {t("parts")}
                {partCount != null && (
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                    ({partCount})
                  </span>
                )}
              </span>
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
                  {taxLabel} ({taxRate}%)
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
