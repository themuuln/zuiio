"use client";

import { useDraggable } from "@dnd-kit/core";
import { Car } from "lucide-react";
import type { Vehicle } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";

// ── Color map for common makes ────────────────────────────
const MAKE_COLORS: Record<string, string> = {
  Toyota: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Lexus: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  Honda: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Hyundai: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Kia: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Mercedes: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  BMW: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Land: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Nissan:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Mazda:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

function getMakeColor(make: string): string {
  for (const [key, cls] of Object.entries(MAKE_COLORS)) {
    if (make.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "bg-muted text-muted-foreground";
}

interface VehicleCardProps {
  workOrderId: string;
  vehicle: Vehicle;
  customerName?: string | null;
  serviceDescription?: string | null;
  compact?: boolean;
}

export function VehicleCard({
  workOrderId,
  vehicle,
  customerName,
  serviceDescription,
  compact,
}: VehicleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `vehicle-${workOrderId}`,
      data: { type: "vehicle", workOrderId },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        willChange: "transform",
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-2 cursor-grab active:cursor-grabbing select-none transition-all touch-manipulation",
        isDragging && "opacity-50 shadow-xl rotate-1",
        !isDragging && "hover:shadow-md hover:border-primary/30",
      )}
    >
      {/* Colored make badge */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          getMakeColor(vehicle.make),
        )}
      >
        <BrandLogo make={vehicle.make} className="size-5" />
      </div>

      {/* Vehicle details */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="font-semibold text-sm truncate flex items-center gap-1.5">
          <span className="truncate">{vehicle.plate_number}</span>
          {customerName && (
            <span className="text-[10px] font-normal text-muted-foreground truncate hidden sm:inline">
              · {customerName}
            </span>
          )}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground truncate">
            {vehicle.make} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
          </div>
        )}
        {serviceDescription && !compact && (
          <div className="text-[10px] text-muted-foreground/70 truncate max-w-[160px]">
            {serviceDescription}
          </div>
        )}
      </div>

      <Car
        className={cn(
          "size-4 shrink-0 mt-1",
          isDragging ? "text-primary" : "text-muted-foreground/30",
        )}
      />
    </div>
  );
}
