"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value?: string; // Format: "yyyy-MM" (e.g. "2026-05")
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthPicker({
  value,
  onChange,
  className,
  placeholder = "Select Month",
  disabled,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentYear, setCurrentYear] = React.useState(() => {
    if (value) {
      const parts = value.split("-");
      return Number(parts[0]);
    }
    return new Date().getFullYear();
  });

  const selectedYear = value ? Number(value.split("-")[0]) : null;
  const selectedMonth = value ? Number(value.split("-")[1]) - 1 : null;

  React.useEffect(() => {
    if (value) {
      setCurrentYear(Number(value.split("-")[0]));
    }
  }, [value]);

  const handleMonthSelect = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, "0");
    const newValue = `${currentYear}-${formattedMonth}`;
    onChange?.(newValue);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    const parts = value.split("-");
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return format(dateObj, "MMMM yyyy");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
        <span>{getDisplayText()}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="flex flex-col gap-4">
          {/* Year selector header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setCurrentYear((prev) => prev - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold">{currentYear}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setCurrentYear((prev) => prev + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, idx) => {
              const isSelected =
                selectedYear === currentYear && selectedMonth === idx;
              const isCurrentMonth =
                new Date().getFullYear() === currentYear &&
                new Date().getMonth() === idx;

              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "h-9 w-full text-xs font-normal",
                    isCurrentMonth &&
                      !isSelected &&
                      "border border-primary/30 bg-primary/5 text-primary",
                  )}
                  onClick={() => handleMonthSelect(idx)}
                >
                  {month}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
