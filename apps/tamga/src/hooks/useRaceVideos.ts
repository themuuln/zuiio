import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RaceVideo {
  id: string;
  horse_id: string;
  race_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  uploaded_at: string;
  // Joined
  horse_name?: string;
  race_name?: string;
}

export function useRaceVideos(userId: string | undefined) {
  return useQuery({
    queryKey: ["race-videos", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("race_videos")
        .select("*, horses(name), races(name)")
        .eq("owner_id", userId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((v: any) => ({
        ...v,
        horse_name: v.horses?.name,
        race_name: v.races?.name,
      })) as RaceVideo[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
