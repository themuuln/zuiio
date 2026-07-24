import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type SubscriptionTier = "free" | "pro" | "breeder" | "stable";

export const TIER_META: Record<
  SubscriptionTier,
  { label: string; price: number; formattedPrice: string; color: string; icon: string }
> = {
  free: {
    label: "Үнэгүй",
    price: 0,
    formattedPrice: "Үнэгүй",
    color: "#9CA3AF",
    icon: "person-outline",
  },
  pro: {
    label: "Pro",
    price: 9900,
    formattedPrice: "₮9,900",
    color: "#2196F3",
    icon: "star-outline",
  },
  breeder: {
    label: "Breeder",
    price: 24900,
    formattedPrice: "₮24,900",
    color: "#4CAF50",
    icon: "pets",
  },
  stable: {
    label: "Stable",
    price: 49900,
    formattedPrice: "₮49,900",
    color: "#FF9800",
    icon: "home",
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["free", "pro", "breeder", "stable"];

export const TIER_FEATURES: {
  label: string;
  free: string;
  pro: string;
  breeder: string;
  stable: string;
}[] = [
  { label: "Морь", free: "1", pro: "Хязгааргүй", breeder: "Хязгааргүй", stable: "Хязгааргүй" },
  { label: "Хадгалах зай", free: "50 MB", pro: "5 GB", breeder: "20 GB", stable: "50 GB" },
  { label: "Удам мод", free: "3 үе", pro: "5 үе", breeder: "Бүгд", stable: "Бүгд" },
  { label: "Цус ойртолт", free: "—", pro: "✓", breeder: "✓", stable: "✓" },
  { label: "Үржүүлэлт", free: "—", pro: "—", breeder: "✓", stable: "✓" },
  { label: "Хэрэглэгч", free: "1", pro: "1", breeder: "1", stable: "10" },
  { label: "Захын portal", free: "—", pro: "—", breeder: "—", stable: "✓" },
  { label: "Сурталчилгаа", free: "—", pro: "✓", breeder: "✓", stable: "✓" },
];

interface UpgradeSubscriptionInput {
  targetTier: SubscriptionTier;
}

interface SubscriptionUpgradeResult {
  payment_code: string;
  amount_mnt: number;
  expires_at: string;
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetTier }: UpgradeSubscriptionInput): Promise<SubscriptionUpgradeResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Нэвтрээгүй байна");

      const meta = TIER_META[targetTier];

      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          tier: targetTier,
          payment_type: "subscription",
          amount_mnt: meta.price,
          status: "pending",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id, payment_code, amount_mnt, expires_at")
        .single();

      if (error) throw error;

      return data as unknown as SubscriptionUpgradeResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Нэвтрээгүй байна");

      const { error } = await supabase.from("subscription_history").insert({
        user_id: user.id,
        old_tier: null,
        new_tier: "free",
        change_reason: "user_cancel",
      });

      if (error) throw error;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("id", user.id);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
