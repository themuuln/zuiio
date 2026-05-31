import { getEndOfDaySummary } from "@/lib/services/report-service";
import { createClient } from "@/lib/supabase/server";

function localDateStr(date?: Date): string {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function closeDay(
  orgId: string,
  userId: string,
  date: string,
): Promise<{ success: boolean; streak: number }> {
  const supabase = await createClient();

  // Capture EOD snapshot before closing
  const eodSummary = await getEndOfDaySummary(orgId, date);

  // Upsert day_close_logs with snapshot
  const { error } = await supabase.from("day_close_logs").upsert(
    {
      organization_id: orgId,
      closed_by: userId,
      date,
      closed_at: new Date().toISOString(),
      summary: eodSummary as unknown as Record<string, unknown>,
      created_by: userId,
    },
    { onConflict: "organization_id, date" },
  );
  if (error) throw error;

  // Calculate streak
  const streak = await getCloseStreak(orgId);

  return { success: true, streak };
}

export async function getCloseStreak(orgId: string): Promise<number> {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("day_close_logs")
    .select("date")
    .eq("organization_id", orgId)
    .order("date", { ascending: false })
    .limit(365);

  if (!logs || logs.length === 0) return 0;

  let streak = 0;
  const _todayLocal = localDateStr();

  for (let i = 0; i < logs.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedStr = localDateStr(expectedDate);

    if (logs[i].date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getDayCloseStatus(
  orgId: string,
  date: string,
): Promise<{ isClosed: boolean; streak: number }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("day_close_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("date", date);

  const streak = await getCloseStreak(orgId);

  return {
    isClosed: (count ?? 0) > 0,
    streak,
  };
}
