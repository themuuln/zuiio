import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import {
  getDailyReport,
  getDailyTimeline,
  getDashboardData,
  getEndOfDaySummary,
  getMechanicsList,
  getMonthlyReport,
  getWeeklyReport,
} from "@/lib/services/report-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "daily";
  const mechanicId = searchParams.get("mechanic");
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  if (type === "mechanics") {
    const mechanics = await getMechanicsList(orgId);
    return NextResponse.json({ data: mechanics });
  }

  if (type === "dashboard") {
    const period =
      (searchParams.get("period") as "today" | "week" | "month" | "all") ?? "all";
    const dashboard = await getDashboardData(orgId, period);
    return NextResponse.json({ data: dashboard });
  }

  const mid = mechanicId ?? "";

  switch (type) {
    case "daily": {
      const report = await getDailyReport(orgId, mid || null, date);
      return NextResponse.json({ data: report });
    }
    case "weekly": {
      const report = await getWeeklyReport(orgId, mid || null, date);
      return NextResponse.json({ data: report });
    }
    case "monthly": {
      const [year, month] = date.split("-").map(Number);
      const report = await getMonthlyReport(orgId, mid || null, year, month);
      return NextResponse.json({ data: report });
    }
    case "eod": {
      const summary = await getEndOfDaySummary(orgId, date);
      return NextResponse.json({ data: summary });
    }
    case "timeline": {
      const timeline = await getDailyTimeline(orgId);
      return NextResponse.json({ data: timeline });
    }
    default:
      throw new ValidationError(
        "Invalid report type. Use: daily, weekly, monthly, eod, dashboard, mechanics",
      );
  }
});
