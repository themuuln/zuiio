import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SellerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  rating: number | null;
  total_sales: number | null;
  verified: boolean;
  created_at: string;
}

export function useSellerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["seller-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data as SellerProfile;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSellerListings(userId: string | undefined) {
  return useQuery({
    queryKey: ["seller-listings", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
