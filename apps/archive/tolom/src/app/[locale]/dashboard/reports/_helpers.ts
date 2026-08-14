import type {
  DailyReport,
  ReportComparison,
  ReportMechanicKpi,
  ReportProfitability,
} from "@/lib/types";

export type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "custom"
  | "eod"
  | "comparison"
  | "finance";

export interface ReportData {
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanic_kpis: ReportMechanicKpi[];
  daily_breakdown?: DailyReport[];
  [key: string]: unknown;
}

export interface EodReport {
  date: string;
  mechanics: Array<{
    mechanic_id: string;
    mechanic_name: string;
    work_orders_completed: number;
    services_performed: number;
    parts_used: number;
    total_revenue: number;
    total_commission?: number;
  }>;
  total_work_orders: number;
  total_revenue: number;
  total_commission?: number;
}

export function periodTitle(
  type: ReportType,
  date: string,
  dateTo?: string,
  loc: string = "mn",
): string {
  if (type === "custom" && dateTo) {
    const fromDate = new Date(date);
    const toDate = new Date(dateTo);
    const formatD = (d: Date) =>
      d.toLocaleDateString(loc, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (fromDate.toDateString() === toDate.toDateString())
      return formatD(fromDate);
    return `${fromDate.toLocaleDateString(loc, { month: "short", day: "numeric" })} – ${formatD(toDate)}`;
  }
  const d = new Date(date);
  const opts: Intl.DateTimeFormatOptions =
    type === "monthly"
      ? { month: "long", year: "numeric" }
      : type === "weekly"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return d.toLocaleDateString(loc, opts);
}

export function getDateRange(
  type: ReportType,
  date: string,
  weekStart: string,
  month: string,
) {
  if (type === "daily" || type === "eod") return { from: date, to: date };
  if (type === "weekly") {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return { from: weekStart, to: end.toISOString().split("T")[0] };
  }
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
