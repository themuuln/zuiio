import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreederProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  region: string | null;
  speciality: string | null;
  rating: number | null;
  total_horses: number;
  total_wins: number;
  verified: boolean;
  created_at: string;
}

export interface LeaderboardEntry extends BreederProfile {
  rank: number;
}

export interface BreederHorse {
  id: string;
  name: string;
  coat: string | null;
  birth_year: number | null;
  gender: string | null;
  image_url: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breeder_profiles")
        .select("*")
        .order("total_wins", { ascending: false })
        .order("rating", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data as BreederProfile[]).map((profile, index) => ({
        ...profile,
        rank: index + 1,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ---------------------------------------------------------------------------
// Single breeder profile
// ---------------------------------------------------------------------------

export function useBreederProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["breeder-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing breeder id");

      const { data, error } = await supabase
        .from("breeder_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BreederProfile;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Horses owned by a breeder (recent first)
// ---------------------------------------------------------------------------

export function useBreederHorses(userId: string | undefined) {
  return useQuery({
    queryKey: ["breeder-horses", userId],
    queryFn: async () => {
      if (!userId) throw new Error("Missing user id");

      const { data, error } = await supabase
        .from("horses")
        .select("id, name, coat, birth_year, gender, image_url, created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BreederHorse[];
    },
    enabled: !!userId,
  });
}
