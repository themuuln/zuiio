import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface LostHorseReport {
  id: string;
  owner_id: string;
  horse_id: string | null;
  description: string | null;
  last_seen_lat: number | null;
  last_seen_lng: number | null;
  last_seen_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  location_aimag: string | null;
  location_sum: string | null;
  location_bag: string | null;
  location_name: string | null;
  animal_type: string | null;
  animal_ages: string[] | null;
  gender: string | null;
  breed: string | null;
  coat_color: string | null;
  lost_count: number | null;
  tamga_image_url: string | null;
  ear_mark_description: string | null;
  contact_phone: string | null;
  pricing_tier: string | null;
  expires_at: string | null;
  renewal_requested: boolean | null;
  sighting_count: number | null;
}

// All lost horses (for search/map view)
export function useLostHorses() {
  return useQuery({
    queryKey: ["lostHorses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .select("*")
        .eq("status", "lost")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LostHorseReport[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// User's own lost horse reports
export function useMyLostHorses(userId: string | undefined) {
  return useQuery({
    queryKey: ["myLostHorses", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LostHorseReport[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Single lost horse by id
export function useLostHorse(id: string | undefined) {
  return useQuery({
    queryKey: ["lostHorse", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("lost_horse_reports")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as LostHorseReport;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
