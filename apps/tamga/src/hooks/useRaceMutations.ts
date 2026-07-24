import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface RegisterEntryInput {
  race_id: string;
  horse_id: string;
}

export function useRegisterRaceEntry(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterEntryInput) => {
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("race_entries")
        .insert({
          ...input,
          owner_id: userId,
          status: "registered",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["race-entries", userId] });
    },
  });
}
export interface RaceInput {
  name: string;
  race_date: string;
  location: string;
  distance_km: number;
  category: string | null;
  description: string | null;
  prize_pool: number | null;
  max_entries: number | null;
}

export function useCreateRace(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RaceInput) => {
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("races")
        .insert({
          ...input,
          owner_id: userId,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["races"] });
    },
  });
}

export function useUpdateRace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RaceInput & { id: string }) => {
      const { id, ...fields } = input;

      const { data, error } = await supabase
        .from("races")
        .update(fields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["races"] });
      qc.invalidateQueries({ queryKey: ["race", variables.id] });
    },
  });
}
