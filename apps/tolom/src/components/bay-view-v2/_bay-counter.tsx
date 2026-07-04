"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";

interface BayCounterProps {
  bayCount: number;
  bayCountInputValue: number | string;
  setBayCountInputValue: (val: number) => void;
  bayCountPending: boolean;
  applyBayCountChange: (val: number) => Promise<void>;
  bayCountMutationInFlightRef: React.MutableRefObject<boolean>;
  bayCountDebounceRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
  t: (key: string) => string;
}

export function BayCounter({
  bayCount,
  bayCountInputValue,
  setBayCountInputValue,
  bayCountPending,
  applyBayCountChange,
  bayCountMutationInFlightRef,
  bayCountDebounceRef,
  t,
}: BayCounterProps) {
  return (
    <div className="flex items-center gap-2 border border-border/50 bg-card rounded-lg p-1 pr-3 pl-2 h-8">
      <span className="text-xs font-mono font-black text-muted-foreground/75 uppercase tracking-wider px-1 select-none">
        Bays
      </span>
      <div className="flex items-center gap-1 rounded border border-border/40 bg-muted/20 p-1 h-full">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={async () => {
            if (bayCountMutationInFlightRef.current) return;
            const next = Math.max(1, bayCount - 1);
            if (next === bayCount) return;
            setBayCountInputValue(next);
            await applyBayCountChange(next);
          }}
          disabled={bayCountPending || bayCount <= 1}
          className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
        >
          <Minus className="size-3" />
        </Button>
        <NumericInput
          min={1}
          max={50}
          value={Number(bayCountInputValue)}
          autoSelect
          onChange={(val) => {
            if (val < 1 || val > 50) {
              setBayCountInputValue(bayCount);
              return;
            }
            setBayCountInputValue(val);
            clearTimeout(bayCountDebounceRef.current ?? undefined);
            bayCountDebounceRef.current = setTimeout(() => {
              applyBayCountChange(val);
            }, 500);
          }}
          onBlur={() => {
            if (bayCountDebounceRef.current) {
              clearTimeout(bayCountDebounceRef.current);
              bayCountDebounceRef.current = null;
            }
            const val = Number(bayCountInputValue);
            if (!Number.isNaN(val) && val >= 1 && val <= 50) {
              applyBayCountChange(val);
            }
          }}
          disabled={bayCountPending}
          className="h-5 w-7 bg-transparent border-0 text-center text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-0 focus-visible:ring-0"
          align="center"
          aria-label={t("bayCount")}
        />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={async () => {
            if (bayCountMutationInFlightRef.current) return;
            const next = Math.min(50, bayCount + 1);
            if (next === bayCount) return;
            setBayCountInputValue(next);
            await applyBayCountChange(next);
          }}
          disabled={bayCountPending || bayCount >= 50}
          className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
        >
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}
