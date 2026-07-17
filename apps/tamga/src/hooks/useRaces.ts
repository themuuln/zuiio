import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Race {
  id: string;
  name: string;
  location: string;
  race_date: string;
  distance_km: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  category: string | null;
  description: string | null;
  prize_pool: number | null;
  max_entries: number | null;
  created_at: string;
}

export interface RaceEntry {
  id: string;
  race_id: string;
  horse_id: string;
  position: number | null;
  finish_time: string | null;
  prize: number | null;
  status: "registered" | "started" | "finished" | "disqualified";
  created_at: string;
  // Joined
  horse_name?: string;
  race_name?: string;
}

export function useRaces(userId: string | undefined) {
  return useQuery({
    queryKey: ["races", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("races")
        .select("*")
        .order("race_date", { ascending: false });

      if (error) throw error;
      return data as Race[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRaceEntries(userId: string | undefined) {
  return useQuery({
    queryKey: ["race-entries", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("race_entries")
        .select("*, horses(name), races(name)")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((e: any) => ({
        ...e,
        horse_name: e.horses?.name,
        race_name: e.races?.name,
      })) as RaceEntry[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRace(raceId: string | undefined) {
  return useQuery({
    queryKey: ["race", raceId],
    queryFn: async () => {
      if (!raceId) return null;

      const { data, error } = await supabase
        .from("races")
        .select("*")
        .eq("id", raceId)
        .single();

      if (error) throw error;
      return data as Race;
    },
    enabled: !!raceId,
    staleTime: 1000 * 60 * 5,
  });
}
