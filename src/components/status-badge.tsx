import { Badge } from "@/components/ui/badge";
import type { WorkOrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; className: string }
> = {
  New: { label: "New", className: "border-blue-300 bg-blue-100 text-blue-800" },
  Diagnosing: {
    label: "Diagnosing",
    className: "border-yellow-300 bg-yellow-100 text-yellow-800",
  },
  "In Progress": {
    label: "In Progress",
    className: "border-orange-300 bg-orange-100 text-orange-800",
  },
  "Ready for Pickup": {
    label: "Ready for Pickup",
    className: "border-green-300 bg-green-100 text-green-800",
  },
  Completed: {
    label: "Completed",
    className: "border-gray-300 bg-gray-100 text-gray-800",
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-red-300 bg-red-100 text-red-800",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: WorkOrderStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "min-h-[32px] px-3 py-1 text-sm font-semibold",
        config?.className,
        className,
      )}
    >
      {config?.label ?? status}
    </Badge>
  );
}
