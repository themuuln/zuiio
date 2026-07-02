"use client";

import { Backspace } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NumericKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  maxValue?: number;
  confirmLabel?: string;
  className?: string;
};

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0", "backspace"],
] as const;

export function NumericKeypad({
  value,
  onChange,
  onConfirm,
  confirmLabel,
  className,
}: NumericKeypadProps) {
  const handleKey = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else if (key === "00") {
      if (value === "0") return;
      onChange(`${value}00`);
    } else {
      // Don't allow leading zeros for single-digit entries
      if (value === "0" && key !== "0") {
        onChange(key);
      } else if (value === "0" && key === "0") {
        // Stay at "0"
        return;
      } else {
        onChange(value + key);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {keys.map((row) => (
        <div key={row.join("-")} className="flex gap-1.5">
          {row.map((key) => {
            if (key === "backspace") {
              return (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  className="flex h-[56px] flex-1 items-center justify-center rounded-xl text-lg"
                  onClick={() => handleKey(key)}
                  aria-label="Устгах"
                >
                  <Backspace className="size-5" />
                </Button>
              );
            }
            return (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="flex h-[56px] flex-1 items-center justify-center rounded-xl text-lg font-semibold"
                onClick={() => handleKey(key)}
              >
                {key}
              </Button>
            );
          })}
        </div>
      ))}

      {/* Bottom row: clear + confirm */}
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="flex h-[56px] flex-1 items-center justify-center rounded-xl text-sm text-muted-foreground"
          onClick={() => onChange("0")}
        >
          Арилгах
        </Button>
        {onConfirm && (
          <Button
            type="button"
            size="lg"
            className="flex h-[56px] flex-[2] items-center justify-center rounded-xl text-sm font-semibold"
            onClick={onConfirm}
            disabled={!value || value === "0"}
          >
            {confirmLabel || "Батлах"}
          </Button>
        )}
      </div>
    </div>
  );
}
