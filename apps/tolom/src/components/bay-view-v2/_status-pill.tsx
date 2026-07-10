"use client";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_PILL } from "./_constants";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  New: <Circle className="size-3" />,
  Diagnosing: <Clock className="size-3" />,
  "In Progress": <AlertCircle className="size-3" />,
  "Ready for Pickup": <CheckCircle2 className="size-3" />,
  Completed: <CheckCircle2 className="size-3" />,
  Cancelled: <XCircle className="size-3" />,
};

export function StatusPill({ status }: { status: string }) {
  const isInProgress = status === "In Progress";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide",
        STATUS_PILL[status] ?? "bg-muted text-muted-foreground",
        isInProgress && "animate-[pulse-ring-warning_2s_ease-in-out_infinite]",
      )}
    >
      {STATUS_ICONS[status] ?? <Circle className="size-3" />}
      {isInProgress && (
        <span className="size-1.5 rounded-full bg-current animate-pulse" />
      )}
      <span className="sm:hidden sr-only">{status}</span>
      <span className="hidden sm:inline">{status}</span>
    </Badge>
  );
}
