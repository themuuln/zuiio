import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const TIER_ORDER: Record<string, number> = {
  free: 0,
  pro: 1,
  breeder: 2,
  stable: 3,
};

export function useTierGate(userId: string | undefined) {
  return useQuery({
    queryKey: ["tier-gate", userId],
    queryFn: async () => {
      if (!userId)
        return { tier: "free" as const, meetsTier: () => false };

      const { data: sub } = await supabase
        .from("subscription_history")
        .select("tier")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const tier = (sub?.tier ?? "free") as keyof typeof TIER_ORDER;
      return {
        tier,
        meetsTier: (min: string) =>
          (TIER_ORDER[tier] ?? 0) >= (TIER_ORDER[min] ?? 0),
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
