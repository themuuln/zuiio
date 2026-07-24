import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TournamentProfile {
  id: string;
  user_id: string;
  horse_id: string;
  tournament_name: string;
  placement: string | null;
  date: string | null;
  notes: string | null;
  is_public: boolean;
  created_at: string;
}

export function useTournamentProfiles(horseId: string | undefined) {
  return useQuery({
    queryKey: ["tournament-profiles", horseId],
    queryFn: async () => {
      if (!horseId) return [];

      const { data, error } = await supabase
        .from("tournament_profiles")
        .select("*")
        .eq("horse_id", horseId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TournamentProfile[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicTournamentProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["tournament-profiles-public", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("tournament_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TournamentProfile[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTournamentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      horse_id: string;
      user_id: string;
      tournament_name: string;
      placement?: string;
      date?: string;
      notes?: string;
      is_public?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("tournament_profiles")
        .insert({
          horse_id: input.horse_id,
          user_id: input.user_id,
          tournament_name: input.tournament_name,
          placement: input.placement ?? null,
          date: input.date ?? null,
          notes: input.notes ?? null,
          is_public: input.is_public ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TournamentProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["tournament-profiles-public"] });
    },
  });
}
