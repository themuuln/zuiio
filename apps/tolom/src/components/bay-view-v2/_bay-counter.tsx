"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { reportServerError } from "@/lib/sentry-report-server";

interface BayCounterProps {
  bayCount: number;
  bayCountInputValue: number | string;
  setBayCountInputValue: (val: number | string) => void;
  bayCountPending: boolean;
  applyBayCountChange: (val: number) => Promise<void>;
  bayCountMutationInFlightRef: React.MutableRefObject<boolean>;
  t: (key: string) => string;
}

export function BayCounter({
  bayCount,
  bayCountInputValue,
  setBayCountInputValue,
  bayCountPending,
  applyBayCountChange,
  bayCountMutationInFlightRef,
  t,
}: BayCounterProps) {
  async function handleCommit(next: number) {
    if (next < 1 || next > 50) {
      setBayCountInputValue(bayCount);
      return;
    }

    setBayCountInputValue(next);

    try {
      await applyBayCountChange(next);
    } catch {
      reportServerError("Unexpected error");
      setBayCountInputValue(bayCount);
    }
  }

  return (
    <div className="flex h-8 items-center gap-2 rounded-lg border border-border/50 bg-card p-1 pr-3 pl-2">
      <span className="select-none px-1 font-mono font-black text-xs text-muted-foreground/75 uppercase tracking-wider">
        Bays
      </span>
      <div className="flex h-full items-center gap-1 rounded border border-border/40 bg-muted/20 p-1">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={async () => {
            if (bayCountMutationInFlightRef.current) return;
            const next = Math.max(1, bayCount - 1);
            if (next === bayCount) return;
            await handleCommit(next);
          }}
          disabled={bayCountPending || bayCount <= 1}
          className="size-5 cursor-pointer rounded hover:bg-background text-muted-foreground"
        >
          <Minus className="size-3" />
        </Button>
        <NumericInput
          min={1}
          max={50}
          value={Number(bayCountInputValue)}
          autoSelect
          onChange={(val) => {
            void handleCommit(val);
          }}
          disabled={bayCountPending}
          className="h-5 w-7 border-0 bg-transparent text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:ring-0 focus-visible:ring-0"
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
            await handleCommit(next);
          }}
          disabled={bayCountPending || bayCount >= 50}
          className="size-5 cursor-pointer rounded hover:bg-background text-muted-foreground"
        >
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}
