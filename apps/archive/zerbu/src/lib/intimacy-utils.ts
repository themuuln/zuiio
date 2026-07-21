import { createClient } from "@/lib/supabase/client";

export async function getPartnerRole(coupleId: string, userId: string): Promise<"a" | "b"> {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true });

  if (!profiles || profiles.length < 2) return "a";
  return profiles[0].id === userId ? "a" : "b";
}

export function getInterestColumn(role: "a" | "b") {
  return role === "a" ? "is_interested_a" : ("is_interested_b" as const);
}

export async function updateInterest(coupleId: string, userId: string, interestId: string, interested: boolean) {
  const role = await getPartnerRole(coupleId, userId);
  const column = getInterestColumn(role);
  const supabase = createClient();
  await supabase.from("intimacy_interests").update({ [column]: interested }).eq("id", interestId);
}
