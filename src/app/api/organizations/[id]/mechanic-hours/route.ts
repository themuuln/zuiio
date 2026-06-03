import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const supabase = await createClient();

  let query = supabase
    .from("mechanic_daily_reports")
    .select("mechanic_id, hours_worked, report_date")
    .eq("organization_id", orgId);

  if (startDate) query = query.gte("report_date", startDate);
  if (endDate) query = query.lte("report_date", endDate);

  const { data } = await query;

  // Aggregate hours per mechanic
  const hoursMap = new Map<string, number>();
  for (const row of data ?? []) {
    const mid = row.mechanic_id;
    hoursMap.set(mid, (hoursMap.get(mid) ?? 0) + Number(row.hours_worked ?? 0));
  }

  // Fetch profile names
  const mechanicIds = [...hoursMap.keys()];
  const { data: profiles } =
    mechanicIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", mechanicIds)
      : { data: [] };

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  const result = [...hoursMap.entries()]
    .map(([mechanic_id, total_hours]) => ({
      mechanic_id,
      mechanic_name: profileMap.get(mechanic_id) ?? "Unknown",
      total_hours,
    }))
    .sort((a, b) => b.total_hours - a.total_hours);

  return NextResponse.json({ data: result });
});
