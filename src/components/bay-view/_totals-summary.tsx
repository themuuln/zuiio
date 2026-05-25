"use client";

import { Separator } from "@/components/ui/separator";
import { formatMNT } from "@/lib/utils";

interface TotalsSummaryProps {
  servicesTotal: number;
  partsTotal: number;
  grandTotal: number;
  t: (key: string) => string;
}

export function TotalsSummary({ servicesTotal, partsTotal, grandTotal, t }: TotalsSummaryProps) {
  return (
    <section className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 p-3 mt-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {t("services")}
          </span>
          <span className="font-medium tabular-nums">
            {formatMNT(servicesTotal)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {t("parts")}
          </span>
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
      </div>
    </section>
  );
}
