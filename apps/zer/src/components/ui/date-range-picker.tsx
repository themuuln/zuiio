"use client";

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  align?: "start" | "center" | "end";
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Огноо сонгох",
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(
    () => value?.from || new Date(),
  );

  React.useEffect(() => {
    if (value?.from) {
      setMonth(value.from);
    }
  }, [value]);

  const presets = [
    {
      label: "Өнөөдөр",
      group: "common",
      getValue: () => ({ from: new Date(), to: new Date() }),
    },
    {
      label: "Өчигдөр",
      group: "common",
      getValue: () => {
        const d = subDays(new Date(), 1);
        return { from: d, to: d };
      },
    },
    {
      label: "Энэ 7 хоног",
      group: "common",
      getValue: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: new Date(),
      }),
    },
    {
      label: "Сүүлийн 7 хоног",
      group: "common",
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: "Энэ сар",
      group: "common",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: new Date(),
      }),
    },
    {
      label: "Сүүлийн 30 хоног",
      group: "common",
      getValue: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      label: "Өнгөрсөн 7 хоног",
      group: "extended",
      getValue: () => {
        const lastWeek = subWeeks(new Date(), 1);
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      },
    },
    {
      label: "Сүүлийн 14 хоног",
      group: "extended",
      getValue: () => ({
        from: subDays(new Date(), 13),
        to: new Date(),
      }),
    },
    {
      label: "Өнгөрсөн сар",
      group: "extended",
      getValue: () => {
        const prevMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(prevMonth),
          to: endOfMonth(prevMonth),
        };
      },
    },
    {
      label: "Сүүлийн 3 сар",
      group: "extended",
      getValue: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: "Сүүлийн 6 сар",
      group: "extended",
      getValue: () => ({
        from: subMonths(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: "Энэ жил",
      group: "extended",
      getValue: () => ({
        from: startOfYear(new Date()),
        to: new Date(),
      }),
    },
    {
      label: "Өнгөрсөн жил",
      group: "extended",
      getValue: () => ({
        from: subMonths(new Date(), 12),
        to: new Date(),
      }),
    },
    {
      label: "Бүх хугацаа",
      group: "extended",
      getValue: () => ({
        from: new Date(2025, 0, 1),
        to: new Date(),
      }),
    },
  ];

  const handlePresetSelect = (getRange: () => DateRange) => {
    const range = getRange();
    onChange?.(range);
    if (range.from) {
      setMonth(range.from);
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value?.from) return placeholder;
    if (!value.to || value.from.toDateString() === value.to.toDateString()) {
      return format(value.from, "LLL dd, yyyy");
    }
    return `${format(value.from, "LLL dd")} – ${format(value.to, "LLL dd, yyyy")}`;
  };

  const isPresetSelected = (preset: (typeof presets)[0]) => {
    if (!value?.from || !value?.to) return false;
    const p = preset.getValue();
    return (
      p.from.toDateString() === value.from.toDateString() &&
      p.to.toDateString() === value.to.toDateString()
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full max-w-xs sm:max-w-sm justify-between text-left font-normal h-9 px-3 gap-2",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
            <span>{getDisplayText()}</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 flex flex-col md:flex-row"
        align={align}
      >
        {/* Left Side: Presets panel */}
        <div className="flex flex-row flex-wrap md:flex-col gap-0.5 p-1.5 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20 md:w-[140px] shrink-0 overflow-x-auto md:overflow-x-visible md:max-h-[330px] md:overflow-y-auto">
          {presets.map((preset, index) => {
            const selected = isPresetSelected(preset);
            const showGroupHeader = index === 0;
            const showGroupSeparator =
              index > 0 && presets[index - 1].group !== preset.group;

            return (
              <React.Fragment key={preset.label}>
                {showGroupHeader && (
                  <div className="hidden md:block text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2.5 mt-1.5 mb-1 select-none">
                    Түгээмэл
                  </div>
                )}
                {showGroupSeparator && (
                  <div className="my-1 px-1 shrink-0">
                    <Separator className="bg-border/60" />
                    <div className="hidden md:block text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mt-2 mb-1 select-none">
                      Бусад
                    </div>
                  </div>
                )}
                <Button
                  variant={selected ? "secondary" : "ghost"}
                  className={cn(
                    "h-8 text-xs font-normal justify-center md:justify-start px-2.5 py-1.5 rounded-md md:w-full shrink-0",
                    selected &&
                      "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                  )}
                  onClick={() => handlePresetSelect(preset.getValue)}
                >
                  {preset.label}
                </Button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side: Calendar Picker */}
        <div className="p-3">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            month={month}
            onMonthChange={setMonth}
            fixedWeeks
            className="p-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
