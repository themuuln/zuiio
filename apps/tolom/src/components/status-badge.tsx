import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { WorkOrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<WorkOrderStatus, string> = {
  New: "border-info/30 bg-info/10 text-info",
  Diagnosing: "border-yellow-300 bg-yellow-100 text-yellow-800",
  "In Progress": "border-orange-300 bg-orange-100 text-orange-800",
  "Ready for Pickup": "border-green-300 bg-green-100 text-green-800",
  Completed: "border-gray-300 bg-gray-100 text-gray-800",
  Cancelled: "border-red-300 bg-red-100 text-red-800",
};

const STATUS_KEY: Record<WorkOrderStatus, string> = {
  New: "common.statusLabels.new",
  Diagnosing: "common.statusLabels.diagnosing",
  "In Progress": "common.statusLabels.inProgress",
  "Ready for Pickup": "common.statusLabels.readyForPickup",
  Completed: "common.statusLabels.completed",
  Cancelled: "common.statusLabels.cancelled",
};

export function StatusBadge({
  status,
  className,
}: {
  status: WorkOrderStatus;
  className?: string;
}) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const label = t(STATUS_KEY[status] ?? status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "min-h-[32px] px-3 py-1 text-sm font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
