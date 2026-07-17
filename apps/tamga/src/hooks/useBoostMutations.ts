import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Types ───────────────────────────────────────────────────────

export type BoostTier = "featured" | "vip" | "premium";

export interface ListingBoost {
  id: string;
  listing_id: string;
  user_id: string;
  tier: BoostTier;
  starts_at: string;
  expires_at: string;
  payment_amount: number;
  created_at: string;
}

// ── Tier metadata ───────────────────────────────────────────────

export const BOOST_META: Record<
  BoostTier,
  {
    label: string;
    price: number;
    formattedPrice: string;
    color: string;
    icon: string;
    duration: string;
    durationDays: number;
  }
> = {
  featured: {
    label: "Онцлох",
    price: 5000,
    formattedPrice: "₮5,000",
    color: "#F59E0B",
    icon: "star",
    duration: "7 хоног",
    durationDays: 7,
  },
  vip: {
    label: "VIP",
    price: 15000,
    formattedPrice: "₮15,000",
    color: "#8B5CF6",
    icon: "diamond",
    duration: "14 хоног",
    durationDays: 14,
  },
  premium: {
    label: "Премиум",
    price: 30000,
    formattedPrice: "₮30,000",
    color: "#EF4444",
    icon: "trophy",
    duration: "30 хоног",
    durationDays: 30,
  },
};

export const BOOST_ORDER: BoostTier[] = ["featured", "vip", "premium"];

// ── Active boosts query ─────────────────────────────────────────

export function useActiveBoosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["activeBoosts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("listing_boosts")
        .select("*, listings(id, horses(name))")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActiveBoostWithListing[];
    },
    enabled: !!userId,
  });
}

export interface ActiveBoostWithListing extends ListingBoost {
  listings?: {
    id: string;
    horses?: { name: string } | null;
  } | null;
}

// ── Boost mutation ──────────────────────────────────────────────

export function useBoostListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      tier,
    }: {
      listingId: string;
      tier: BoostTier;
    }) => {
      const meta = BOOST_META[tier];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + meta.durationDays);

      const { data, error } = await supabase
        .from("listing_boosts")
        .insert({
          listing_id: listingId,
          user_id: "11111111-1111-1111-1111-111111111111",
          tier,
          expires_at: expiresAt.toISOString(),
          payment_amount: meta.price,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeBoosts"] });
    },
  });
}
