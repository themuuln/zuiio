import type { WorkOrderStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; className: string }
> = {
  New: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-300" },
  Diagnosing: {
    label: "Diagnosing",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  "Ready for Pickup": {
    label: "Ready for Pickup",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  Completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-300",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: WorkOrderStatus;
  className?: string;
}) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold min-h-[32px]",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
