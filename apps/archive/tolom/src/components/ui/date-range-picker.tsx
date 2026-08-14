"use client";

import { format } from "date-fns";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  align?: "start" | "center" | "end";
  defaultValue?: DateRange;
}

interface Preset {
  label: string;
  icon: React.ReactNode;
  getValue: () => DateRange;
  group: "quick" | "extended";
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder,
  align = "start",
  defaultValue,
}: DateRangePickerProps) {
  const t = useTranslations("dateRangePicker");
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(
    () => value?.from || new Date(),
  );

  const appliedDefault = React.useRef(false);
  React.useEffect(() => {
    if (!value && defaultValue && !appliedDefault.current) {
      onChange?.(defaultValue);
      appliedDefault.current = true;
    }
  }, [value, defaultValue, onChange]);

  React.useEffect(() => {
    if (value?.from) {
      setMonth(value.from);
    }
  }, [value]);

  const presets: Preset[] = React.useMemo(
    () => [
      {
        label: t("today"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({ from: new Date(), to: new Date() }),
        group: "quick",
      },
      {
        label: t("last7Days"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          to: new Date(),
        }),
        group: "quick",
      },
      {
        label: t("thisMonth"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(),
        }),
        group: "quick",
      },
      {
        label: t("last30Days"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          to: new Date(),
        }),
        group: "quick",
      },
      {
        label: t("last3Months"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 3,
            1,
          ),
          to: new Date(),
        }),
        group: "extended",
      },
      {
        label: t("last6Months"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 6,
            1,
          ),
          to: new Date(),
        }),
        group: "extended",
      },
      {
        label: t("thisYear"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(new Date().getFullYear(), 0, 1),
          to: new Date(),
        }),
        group: "extended",
      },
      {
        label: t("allTime"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => ({
          from: new Date(2025, 0, 1),
          to: new Date(),
        }),
        group: "extended",
      },
    ],
    [t],
  );

  const handlePresetSelect = (getRange: () => DateRange) => {
    const range = getRange();
    onChange?.(range);
    if (range.from) {
      setMonth(range.from);
    }
    setIsOpen(false);
  };

  const isSelected = (preset: Preset) => {
    if (!value?.from || !value?.to) return false;
    const presetRange = preset.getValue();
    return (
      !!presetRange.from &&
      !!presetRange.to &&
      presetRange.from.toDateString() === value.from.toDateString() &&
      presetRange.to.toDateString() === value.to.toDateString()
    );
  };

  const getDisplayText = () => {
    if (!value?.from) return placeholder || t("placeholder");
    if (!value.to || value.from.toDateString() === value.to.toDateString()) {
      return format(value.from, "MMM d, yyyy");
    }
    return `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`;
  };

  const quickPresets = presets.filter((p) => p.group === "quick");
  const extendedPresets = presets.filter((p) => p.group === "extended");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal h-9 px-3 gap-2",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarDays className="size-4 text-muted-foreground shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground shrink-0 rotate-90" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] p-0 rounded-xl overflow-hidden md:w-auto md:max-w-none"
        align={align}
      >
        {/* Mobile: Presets as horizontal scroll above calendar */}
        <div className="md:hidden">
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-border/40 bg-muted/30">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal justify-start px-2.5 gap-1.5 rounded-lg shrink-0",
                  isSelected(preset) &&
                    "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                )}
                onClick={() => handlePresetSelect(preset.getValue)}
              >
                {preset.icon}
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop: Presets as vertical sidebar */}
        <div className="hidden md:flex md:flex-row">
          <div className="flex flex-col gap-1 p-2 border-r border-border/40 bg-muted/30 w-[160px] shrink-0">
            {/* Quick presets */}
            <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 py-1.5 select-none">
              Quick
            </div>
            {quickPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal justify-start px-2.5 gap-2 rounded-lg w-full shrink-0",
                  isSelected(preset) &&
                    "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                )}
                onClick={() => handlePresetSelect(preset.getValue)}
              >
                {preset.icon}
                {preset.label}
              </Button>
            ))}

            {/* Extended presets */}
            <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 py-1.5 select-none">
              Extended
            </div>
            {extendedPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal justify-start px-2.5 gap-2 rounded-lg w-full shrink-0",
                  isSelected(preset) &&
                    "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                )}
                onClick={() => handlePresetSelect(preset.getValue)}
              >
                {preset.icon}
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
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
        </div>

        {/* Mobile: Calendar below presets (full width) */}
        <div className="md:hidden p-2">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            month={month}
            onMonthChange={setMonth}
            fixedWeeks
            className="p-0 w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
