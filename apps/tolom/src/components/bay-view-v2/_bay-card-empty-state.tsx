"use client";

import { Plus } from "lucide-react";
import { BayNumberLabel } from "./_bay-number-label";

interface BayCardEmptyStateProps {
  bayNumber: number;
  onAssignClick?: (bayNumber: number) => void;
}

export function BayCardEmptyState({
  bayNumber,
  onAssignClick,
}: BayCardEmptyStateProps) {
  return (
    <button
      type="button"
      onClick={() => onAssignClick?.(bayNumber)}
      className="group/btn relative flex h-full w-full flex-1 cursor-pointer flex-col items-center justify-center gap-3 px-4 py-6 text-center transition-all duration-200"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:12px_12px] transition-opacity duration-300 group-hover/btn:opacity-60" />

      <div className="z-10 flex size-12 items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 shadow-sm transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:border-primary/50 group-hover/btn:bg-primary/10 group-hover/btn:text-primary group-hover/btn:shadow-md">
        <Plus className="size-6 text-muted-foreground/50 transition-colors group-hover/btn:text-primary" />
      </div>

      <div className="z-10 flex flex-col gap-1">
        <BayNumberLabel
          bayNumber={bayNumber}
          className="uppercase text-muted-foreground/70 transition-colors group-hover/btn:text-primary/80"
        />
        <span className="text-[11px] font-medium text-muted-foreground/50 transition-colors group-hover/btn:text-primary/70">
          Click to add vehicle
        </span>
      </div>
    </button>
  );
}
