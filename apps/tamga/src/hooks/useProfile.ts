import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  display_name: string;
  phone: string | null;
  region: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  user_role: string;
  created_at: string;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
