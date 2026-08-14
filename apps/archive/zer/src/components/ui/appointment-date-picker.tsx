"use client";

import { addDays, addMonths, format, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
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

/**
 * Forward-looking date picker for selecting future dates (appointments, etc.).
 * Shows quick presets like "Tomorrow", "In 1 week", "In 1 month".
 * Calendar disables past dates.
 */
export function AppointmentDatePicker({
  value,
  onChange,
  className,
  placeholder = "Огноо сонгох",
  minDate,
}: AppointmentDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const today = startOfDay(new Date());
  const disabledBefore = minDate ?? today;

  const presets = React.useMemo(
    () => [
      {
        label: "Өнөөдөр",
        getValue: () => new Date(),
      },
      {
        label: "Маргааш",
        getValue: () => addDays(new Date(), 1),
      },
      {
        label: "7 хоногийн дараа",
        getValue: () => addDays(new Date(), 7),
      },
      {
        label: "2 долоо хоногийн дараа",
        getValue: () => addDays(new Date(), 14),
        separator: true,
      },
      {
        label: "1 сарын дараа",
        getValue: () => addMonths(new Date(), 1),
      },
      {
        label: "3 сарын дараа",
        getValue: () => addMonths(new Date(), 3),
      },
      {
        label: "6 сарын дараа",
        getValue: () => addMonths(new Date(), 6),
        separator: true,
      },
      {
        label: "Арилгах",
        getValue: () => undefined,
      },
    ],
    [],
  );

  const handlePresetSelect = (getVal: () => Date | undefined) => {
    const date = getVal();
    onChange?.(date);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    return format(value, "EEE, MMM d, yyyy");
  };

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
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
              <span>{getDisplayText()}</span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent
        className="w-auto p-0 flex flex-col md:flex-row overflow-hidden"
        align="start"
      >
        {/* Left: Quick presets */}
        <div className="flex flex-row flex-wrap md:flex-col gap-0.5 p-1.5 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20 md:w-[180px] shrink-0 overflow-x-auto">
          {presets.map((preset) => (
            <React.Fragment key={preset.label}>
              {preset.separator && (
                <div className="my-1 px-1 shrink-0">
                  <Separator className="bg-border/60" />
                </div>
              )}
              <Button
                variant="ghost"
                className={cn(
                  "h-8 text-xs font-normal justify-center md:justify-start px-2.5 py-1.5 rounded-md md:w-full shrink-0",
                  value &&
                    preset.getValue() instanceof Date &&
                    isSameDay(value, preset.getValue() as Date) &&
                    "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                )}
                onClick={() => handlePresetSelect(preset.getValue)}
              >
                {preset.label}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Calendar */}
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
      </PopoverContent>
    </Popover>
  );
}
