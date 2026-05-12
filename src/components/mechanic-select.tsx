"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mechanic {
  id: string;
  full_name?: string | null;
  fullName?: string | null;
  email?: string;
  current_jobs?: number;
}

interface MechanicSelectProps {
  value: string;
  onChange: (mechanicId: string) => void;
  mechanics: Mechanic[];
  disabled?: boolean;
  placeholder?: string;
  showJobCount?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const SIZE_STYLES = {
  sm: "h-9 text-xs px-2 py-1",
  default: "h-11 text-sm px-3 py-2",
  lg: "h-12 text-base px-4 py-3",
};

function getMechanicName(m: Mechanic): string {
  return m.full_name ?? m.fullName ?? m.email ?? "Unknown";
}

export function MechanicSelect({
  value,
  onChange,
  mechanics,
  disabled,
  placeholder = "Unassigned",
  showJobCount,
  className,
  size = "default",
}: MechanicSelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-input bg-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none",
          SIZE_STYLES[size],
        )}
        aria-label="Assign mechanic"
      >
        <option value="">{placeholder}</option>
        {mechanics.map((m) => (
          <option key={m.id} value={m.id}>
            {getMechanicName(m)}
            {showJobCount && m.current_jobs !== undefined && m.current_jobs > 0
              ? ` (${m.current_jobs} job${m.current_jobs !== 1 ? "s" : ""})`
              : ""}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <User className="size-4 text-muted-foreground/50" aria-hidden="true" />
      </div>
    </div>
  );
}
