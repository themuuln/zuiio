"use client";

import { cn } from "@/lib/utils";
import type { StaffCommissionSummary } from "../actions";

export function StaffCard({
  staff,
  isSelected,
  onSelect,
}: {
  staff: StaffCommissionSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 text-left shadow-sm transition-all",
        "hover:border-primary/50 hover:shadow-md",
        isSelected && "border-primary ring-1 ring-primary/30 bg-primary/5",
        !isSelected && "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {staff.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{staff.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {staff.totalUnpaid > 0
              ? `${staff.totalUnpaid.toLocaleString()}₮ төлөгдөөгүй`
              : "Бүгд төлөгдсөн"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-green-50 px-2 py-1.5 dark:bg-green-950/30">
          <p className="text-xs text-muted-foreground">Нийт</p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            {staff.totalEarned.toLocaleString()}₮
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-2 py-1.5 dark:bg-blue-950/30">
          <p className="text-xs text-muted-foreground">Төлсөн</p>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            {staff.totalPaid.toLocaleString()}₮
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-1.5 dark:bg-amber-950/30">
          <p className="text-xs text-muted-foreground">Үлдэгдэл</p>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {staff.totalUnpaid.toLocaleString()}₮
          </p>
        </div>
      </div>
    </button>
  );
}
