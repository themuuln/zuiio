"use client";

import type { DisplayWorkOrder } from "@/app/api/organizations/[id]/display/work-orders/route";
import {
  STATUS_BADGE_COLORS,
  STATUS_COLORS,
  STATUS_DISPLAY_NAMES,
} from "@/components/workshop-display/constants";
import { ElapsedTimer } from "@/components/workshop-display/elapsed-timer";

interface WorkOrderCardProps {
  workOrder: DisplayWorkOrder;
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const statusClass =
    STATUS_COLORS[workOrder.status] ?? "border-t-gray-500 bg-gray-950/20";
  const badgeClass =
    STATUS_BADGE_COLORS[workOrder.status] ??
    "bg-gray-500/20 text-gray-300 border-gray-500/30";
  const statusName = STATUS_DISPLAY_NAMES[workOrder.status] ?? workOrder.status;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-white/10 border-t-4 p-5 shadow-lg backdrop-blur-sm ${statusClass}`}
    >
      {/* Header: Status badge + elapsed time */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-semibold ${badgeClass}`}
        >
          {statusName}
        </span>
        <span className="text-2xl font-mono font-bold text-white/80 tabular-nums">
          <ElapsedTimer
            since={
              workOrder.status_changed_at ??
              workOrder.started_at ??
              workOrder.created_at
            }
          />
        </span>
      </div>

      {/* Vehicle info */}
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-white tracking-tight">
          {workOrder.plate_number ?? "—"}
        </span>
        {(workOrder.vehicle_make || workOrder.vehicle_model) && (
          <span className="text-base text-white/60">
            {[workOrder.vehicle_make, workOrder.vehicle_model]
              .filter(Boolean)
              .join(" ")}
          </span>
        )}
      </div>

      {/* Complaint / description */}
      {workOrder.complaint && (
        <p className="text-sm text-white/50 line-clamp-2 italic">
          &ldquo;{workOrder.complaint}&rdquo;
        </p>
      )}

      {/* Customer + Mechanic row */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wider text-white/40">
            Customer
          </span>
          <span className="font-medium text-white/80">
            {workOrder.customer_name ?? "—"}
          </span>
        </div>
        {workOrder.mechanic_name && (
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs uppercase tracking-wider text-white/40">
              Mechanic
            </span>
            <span className="font-medium text-white/80">
              {workOrder.mechanic_name}
            </span>
          </div>
        )}
      </div>

      {/* Service names */}
      {workOrder.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workOrder.services.slice(0, 3).map((s, i) => (
            <span
              key={`${workOrder.id}-service-${i}`}
              className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70"
            >
              {s.name}
            </span>
          ))}
          {workOrder.services.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/50">
              +{workOrder.services.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
