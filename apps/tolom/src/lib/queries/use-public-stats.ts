import { useQuery } from "@tanstack/react-query";
import { publicStatsKeys } from "./keys";

export interface PublicStats {
  shops: number;
  vehiclesServiced: number;
  satisfaction: number;
}

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch("/api/public/stats");
  if (!res.ok) throw new Error("Failed to fetch public stats");
  return res.json();
}

export function usePublicStats() {
  return useQuery({
    queryKey: publicStatsKeys.all,
    queryFn: fetchPublicStats,
    staleTime: 5 * 60 * 1000, // 5 minutes — stats change slowly
    gcTime: 10 * 60 * 1000, // keep in cache for 10 min after unmount
  });
}
