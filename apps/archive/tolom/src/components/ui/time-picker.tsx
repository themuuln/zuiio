"use client";

import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export function TimePicker({
  value,
  onChange,
  className,
  disabled,
}: TimePickerProps) {
  const hour = value?.getHours() ?? 9;
  const rawMinute = value?.getMinutes() ?? 0;
  // Snap to nearest valid minute (0, 15, 30, 45)
  const minute = MINUTES.reduce((prev, curr) =>
    Math.abs(curr - rawMinute) < Math.abs(prev - rawMinute) ? curr : prev,
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="size-4 text-muted-foreground shrink-0" />
      <Select
        value={hour.toString()}
        onValueChange={(h) => {
          const d = value ? new Date(value) : new Date();
          d.setHours(Number(h));
          onChange?.(d);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h.toString()}>
              {h === 0
                ? "12 AM"
                : h === 12
                  ? "12 PM"
                  : h < 12
                    ? `${h} AM`
                    : `${h - 12} PM`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={minute.toString()}
        onValueChange={(m) => {
          const d = value ? new Date(value) : new Date();
          d.setMinutes(Number(m));
          onChange?.(d);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {m.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
