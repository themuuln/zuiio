import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const REQUEST_LIMITS = {
  maxToolRounds: 5,
  maxTotalTokens: 16_384,
  maxResultTokens: 2_048,
} as const;

export const DAILY_LIMITS = {
  softCapTokens: 500_000,
  hardCapTokens: 1_000_000,
} as const;

/**
 * Check if a request is within the org's daily spend budget.
 */
export async function checkDailyBudget(
  supabase: SupabaseClient,
  orgId: string,
): Promise<{ allowed: boolean; reason?: string; tokensUsedToday: number }> {
  const today = new Date().toISOString().split("T")[0]!;
  const { data, error } = await supabase
    .from("agent_daily_spend")
    .select("tokens_used")
    .eq("organization_id", orgId)
    .eq("date", today)
    .single();

  const tokensUsed = (data?.tokens_used as number) ?? 0;

  if (error && error.code !== "PGRST116" && error.code !== "42P01") {
    console.error("Budget check error:", error.message);
  }

  if (tokensUsed >= DAILY_LIMITS.hardCapTokens) {
    return { allowed: false, reason: `Өнөөдрийн токены хязгаар дууссан. Маргааш дахин оролдоно уу.`, tokensUsedToday: tokensUsed };
  }

  return { allowed: true, tokensUsedToday: tokensUsed };
}

/**
 * Record token usage via atomic increment to avoid race conditions.
 * Uses PostgREST's batch increment syntax.
 */
export async function recordUsageAtomic(
  supabase: SupabaseClient,
  orgId: string,
  tokensUsed: number,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]!;

  // Atomic increment using PostgREST's RPC or batch arithmetic
  // Try to insert first; if conflict, increment
  const { error } = await supabase.rpc("increment_daily_spend", {
    p_org_id: orgId,
    p_date: today,
    p_tokens: tokensUsed,
  });

  if (error && error.code === "42883") {
    // Function doesn't exist — fall back to upsert (best-effort)
    const { error: upsertErr } = await supabase.from("agent_daily_spend").upsert(
      {
        organization_id: orgId,
        date: today,
        tokens_used: tokensUsed,
        api_calls: 1,
      },
      { onConflict: "organization_id,date", ignoreDuplicates: false },
    );
    if (upsertErr && upsertErr.code !== "42P01") {
      console.error("Failed to record usage:", upsertErr.message);
    }
  } else if (error) {
    console.error("Atomic increment failed:", error.message);
  }
}
