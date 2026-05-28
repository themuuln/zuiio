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

const STATUS_STYLES: Record<string, string> = {
  New: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  Diagnosing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "In Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Ready for Pickup":
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Completed:
    "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  New: <Circle className="size-2.5" />,
  Diagnosing: <Clock className="size-2.5" />,
  "In Progress": <AlertCircle className="size-2.5" />,
  "Ready for Pickup": <CheckCircle2 className="size-2.5" />,
  Completed: <CheckCircle2 className="size-2.5" />,
  Cancelled: <XCircle className="size-2.5" />,
};

export function StatusPill({ status }: { status: string }) {
  const isInProgress = status === "In Progress";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        isInProgress && "animate-[pulse-ring-warning_2s_ease-in-out_infinite]",
      )}
    >
      {STATUS_ICONS[status] ?? <Circle className="size-2.5" />}
      {isInProgress && (
        <span className="size-1.5 rounded-full bg-current animate-pulse" />
      )}
      <span className="hidden sm:inline">{status}</span>
    </Badge>
  );
}
