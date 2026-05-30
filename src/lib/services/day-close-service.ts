import { createClient } from "@/lib/supabase/server";

export async function closeDay(
  orgId: string,
  userId: string,
  date: string,
): Promise<{ success: boolean; streak: number }> {
  const supabase = await createClient();

  // Upsert day_close_logs (unique constraint on org_id + date)
  const { error } = await supabase.from("day_close_logs").upsert(
    {
      organization_id: orgId,
      closed_by: userId,
      date,
      closed_at: new Date().toISOString(),
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < logs.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedStr = expectedDate.toISOString().split("T")[0];

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
