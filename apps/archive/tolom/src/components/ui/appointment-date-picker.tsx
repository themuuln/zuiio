"use client";

import { addDays, addMonths, format, isSameDay, startOfDay } from "date-fns";
import { CalendarDays, ChevronRight, Clock, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppointmentDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  minDate?: Date;
}

interface Preset {
  label: string;
  icon: React.ReactNode;
  getValue: () => Date | undefined;
  group: "soon" | "later" | "action";
}

/**
 * Forward-looking date picker for selecting future dates (appointments, etc.).
 * Shows quick presets like "Tomorrow", "In 1 month", "In 3 months".
 * Calendar disables past dates.
 */
export function AppointmentDatePicker({
  value,
  onChange,
  className,
  placeholder,
  minDate,
}: AppointmentDatePickerProps) {
  const t = useTranslations("dateRangePicker");
  const [isOpen, setIsOpen] = React.useState(false);
  const today = startOfDay(new Date());
  const disabledBefore = minDate ?? today;

  const presets: Preset[] = React.useMemo(
    () => [
      {
        label: t("today"),
        icon: <Clock className="size-3.5" />,
        getValue: () => new Date(),
        group: "soon",
      },
      {
        label: t("tomorrow"),
        icon: <Clock className="size-3.5" />,
        getValue: () => addDays(new Date(), 1),
        group: "soon",
      },
      {
        label: t("inOneWeek"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => addDays(new Date(), 7),
        group: "soon",
      },
      {
        label: t("inTwoWeeks"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => addDays(new Date(), 14),
        group: "later",
      },
      {
        label: t("inOneMonth"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => addMonths(new Date(), 1),
        group: "later",
      },
      {
        label: t("inThreeMonths"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => addMonths(new Date(), 3),
        group: "later",
      },
      {
        label: t("inSixMonths"),
        icon: <CalendarDays className="size-3.5" />,
        getValue: () => addMonths(new Date(), 6),
        group: "later",
      },
      {
        label: t("clearDate"),
        icon: <RotateCcw className="size-3.5" />,
        getValue: () => undefined,
        group: "action",
      },
    ],
    [t],
  );

  const handlePresetSelect = (getVal: () => Date | undefined) => {
    const date = getVal();
    onChange?.(date);
    setIsOpen(false);
  };

  const isSelected = (preset: Preset) => {
    if (!value) return false;
    const presetValue = preset.getValue();
    if (!presetValue) return false;
    return isSameDay(value, presetValue);
  };

  const getDisplayText = () => {
    if (!value) return placeholder || t("selectDate");
    return format(value, "EEE, MMM d, yyyy");
  };

  const soonPresets = presets.filter((p) => p.group === "soon");
  const laterPresets = presets.filter((p) => p.group === "later");
  const actionPresets = presets.filter((p) => p.group === "action");

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
        align="start"
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
            {/* Soon presets */}
            <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 py-1.5 select-none">
              Soon
            </div>
            {soonPresets.map((preset) => (
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

            {/* Later presets */}
            <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 py-1.5 select-none">
              Later
            </div>
            {laterPresets.map((preset) => (
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

            {/* Action presets */}
            <Separator className="my-1" />
            {actionPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal justify-start px-2.5 gap-2 rounded-lg w-full shrink-0 text-muted-foreground",
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
              mode="single"
              selected={value}
              onSelect={(day) => {
                onChange?.(day);
                if (day) setIsOpen(false);
              }}
              disabled={(date) => date < disabledBefore}
              className="p-0"
            />
          </div>
        </div>

        {/* Mobile: Calendar below presets (full width) */}
        <div className="md:hidden p-2">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(day) => {
              onChange?.(day);
              if (day) setIsOpen(false);
            }}
            disabled={(date) => date < disabledBefore}
            className="p-0 w-full"
          />
        </div>
        <div></div>
      </PopoverContent>
    </Popover>
  );
}
