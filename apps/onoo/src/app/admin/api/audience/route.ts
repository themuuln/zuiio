import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface AudienceTotalsByType {
  entity_type: string;
  total_views: number;
}

export interface AudienceDailyTotal {
  view_date: string;
  total_views: number;
}

export interface AudienceTopEntity {
  entity_id: string;
  view_count: number;
}

export interface AudienceResponse {
  totalsByType: AudienceTotalsByType[];
  dailyTotals: AudienceDailyTotal[];
  topPlayers: AudienceTopEntity[];
  topGames: AudienceTopEntity[];
  grandTotal: number;
}

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const supabase = createServiceRoleClient();

    const startDate = request.nextUrl.searchParams.get("start_date");
    const endDate = request.nextUrl.searchParams.get("end_date");

    // Build date-range filter
    const fromDate = startDate ?? "1970-01-01";
    const toDate = endDate ?? "2099-12-31";

    // ── Totals per entity_type ──
    const { data: totalsByType } = await supabase
      .from("daily_page_views")
      .select("entity_type, view_count")
      .gte("view_date", fromDate)
      .lte("view_date", toDate);

    // ── Daily totals (for line chart) ──
    const { data: dailyTotals } = await supabase
      .from("daily_page_views")
      .select("view_date, view_count")
      .gte("view_date", fromDate)
      .lte("view_date", toDate)
      .order("view_date", { ascending: true });

    // ── Top 10 players ──
    const { data: topPlayers } = await supabase
      .from("daily_page_views")
      .select("entity_id, view_count")
      .eq("entity_type", "player")
      .gte("view_date", fromDate)
      .lte("view_date", toDate)
      .order("view_count", { ascending: false })
      .limit(10);

    // ── Top 10 games ──
    const { data: topGames } = await supabase
      .from("daily_page_views")
      .select("entity_id, view_count")
      .eq("entity_type", "game")
      .gte("view_date", fromDate)
      .lte("view_date", toDate)
      .order("view_count", { ascending: false })
      .limit(10);

    // Aggregate totals by type
    const typeTotals: Record<string, number> = {};
    let grandTotal = 0;
    for (const row of (totalsByType ?? []) as Array<{
      entity_type: string;
      view_count: number;
    }>) {
      typeTotals[row.entity_type] =
        (typeTotals[row.entity_type] ?? 0) + row.view_count;
      grandTotal += row.view_count;
    }

    const aggregatedTotalsByType: AudienceTotalsByType[] = Object.entries(
      typeTotals,
    ).map(([entity_type, total_views]) => ({ entity_type, total_views }));

    // Aggregate daily totals (sum view_count per view_date)
    const dailyTotalsByDate: Record<string, number> = {};
    for (const row of (dailyTotals ?? []) as Array<{
      view_date: string;
      view_count: number;
    }>) {
      dailyTotalsByDate[row.view_date] =
        (dailyTotalsByDate[row.view_date] ?? 0) + row.view_count;
    }
    const aggregatedDaily: AudienceDailyTotal[] = Object.entries(
      dailyTotalsByDate,
    )
      .map(([view_date, total_views]) => ({ view_date, total_views }))
      .sort((a, b) => a.view_date.localeCompare(b.view_date));

    const response: AudienceResponse = {
      totalsByType: aggregatedTotalsByType,
      dailyTotals: aggregatedDaily,
      topPlayers: (topPlayers ?? []) as AudienceTopEntity[],
      topGames: (topGames ?? []) as AudienceTopEntity[],
      grandTotal,
    };

    return NextResponse.json(response);
  });
}
