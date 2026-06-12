"use client";

import { cn } from "@/lib/utils";
import { STATUS_ACCENT } from "./_constants";

interface BayCardAccentProps {
  status: string;
}

export function BayCardAccent({ status }: BayCardAccentProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 top-0 w-[4px]",
        STATUS_ACCENT[status] ?? "bg-primary",
      )}
    />
  );
}
