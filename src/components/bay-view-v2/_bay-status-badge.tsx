"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASS } from "./_constants";

interface BayStatusBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export function BayStatusBadge({
  status,
  label,
  className,
}: BayStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded-full border px-2 text-xs font-bold uppercase tracking-wider",
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {status === "In Progress" && (
        <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-current" />
      )}
      {label}
    </Badge>
  );
}
