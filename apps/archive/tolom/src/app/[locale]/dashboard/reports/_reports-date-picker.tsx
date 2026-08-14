import { Calendar } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import type { ReportType } from "./_helpers";

interface ReportsDatePickerProps {
  reportType: ReportType;
  date: string;
  weekStart: string;
  month: string;
  customRange: DateRange | undefined;
  onDateChange: (date: string) => void;
  onWeekStartChange: (weekStart: string) => void;
  onMonthChange: (month: string) => void;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export function ReportsDatePicker({
  reportType,
  date,
  weekStart,
  month,
  customRange,
  onDateChange,
  onWeekStartChange,
  onMonthChange,
  onCustomRangeChange,
}: ReportsDatePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
      {(reportType === "daily" || reportType === "eod") && (
        <DatePicker
          value={date ? new Date(date) : undefined}
          onChange={(d) => {
            if (d) {
              const year = d.getFullYear();
              const monthStr = String(d.getMonth() + 1).padStart(2, "0");
              const dayStr = String(d.getDate()).padStart(2, "0");
              onDateChange(`${year}-${monthStr}-${dayStr}`);
            }
          }}
          className="w-[180px]"
        />
      )}
      {reportType === "weekly" && (
        <DatePicker
          value={weekStart ? new Date(weekStart) : undefined}
          onChange={(d) => {
            if (d) {
              const dateCopy = new Date(d);
              const day = dateCopy.getDay();
              const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(dateCopy.setDate(diff));
              const year = monday.getFullYear();
              const monthStr = String(monday.getMonth() + 1).padStart(2, "0");
              const dayStr = String(monday.getDate()).padStart(2, "0");
              onWeekStartChange(`${year}-${monthStr}-${dayStr}`);
            }
          }}
          className="w-[180px]"
        />
      )}
      {reportType === "monthly" && (
        <MonthPicker
          value={month}
          onChange={onMonthChange}
          className="w-[180px]"
        />
      )}
      {reportType === "custom" && (
        <DateRangePicker
          value={customRange}
          onChange={onCustomRangeChange}
          className="w-[260px]"
        />
      )}
    </div>
  );
}
