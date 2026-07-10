"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { BayNumberLabel } from "./_bay-number-label";

interface BayCardEmptyStateProps {
  bayNumber: number;
  onAssignClick?: (bayNumber: number) => void;
}

export function BayCardEmptyState({
  bayNumber,
  onAssignClick,
}: BayCardEmptyStateProps) {
  const t = useTranslations("bayView");
  return (
    <button
      type="button"
      onClick={() => onAssignClick?.(bayNumber)}
      className="group/btn relative flex h-full w-full flex-1 cursor-pointer flex-col items-center justify-center gap-4 px-4 py-8 text-center transition-[background-color,border-color] duration-200"
    >
      <div className="z-10 flex size-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-[background-color,border-color,transform] duration-300 group-hover/btn:scale-105 group-hover/btn:border-primary/40 group-hover/btn:bg-primary/5">
        <Plus className="size-7 text-muted-foreground/40 transition-colors group-hover/btn:text-primary" />
      </div>

      <div className="z-10 flex flex-col gap-1.5">
        <BayNumberLabel
          bayNumber={bayNumber}
          className="text-sm font-semibold uppercase text-muted-foreground/60 transition-colors group-hover/btn:text-primary/80"
        />
        <span className="text-xs text-muted-foreground/40 transition-colors group-hover/btn:text-primary/60">
          {t("clickToAddVehicle")}
        </span>
      </div>
    </button>
  );
}
