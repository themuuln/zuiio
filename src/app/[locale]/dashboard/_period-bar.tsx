"use client";

import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface DateFilterBarProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  return (
    <DateRangePicker
      value={value}
      onChange={onChange}
      className="w-full sm:w-[260px]"
      align="end"
    />
  );
}
