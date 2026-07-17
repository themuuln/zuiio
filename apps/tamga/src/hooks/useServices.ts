import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ServiceProvider {
  id: string;
  name: string;
  type: string;
  phone: string;
  address: string | null;
  rating: number | null;
  specialties: string[] | null;
  available: boolean;
  created_at: string;
}

export interface ServiceBooking {
  id: string;
  horse_id: string;
  provider_id: string;
  service_type: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  cost: number | null;
  created_at: string;
  // Joined
  provider_name?: string;
  horse_name?: string;
}

export function useServiceProviders(userId: string | undefined) {
  return useQuery({
    queryKey: ["service-providers", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("owner_id", userId)
        .order("name");

      if (error) throw error;
      return data as ServiceProvider[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useServiceBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ["service-bookings", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("service_bookings")
        .select("*, service_providers(name), horses(name)")
        .eq("owner_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((b: any) => ({
        ...b,
        provider_name: b.service_providers?.name,
        horse_name: b.horses?.name,
      })) as ServiceBooking[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVetProfiles() {
  return useQuery({
    queryKey: ["vet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vet_profiles")
        .select("*")
        .eq("verified", true)
        .order("rating", { ascending: false });

      if (error) throw error;
      return data as ServiceProvider[];
    },
    staleTime: 1000 * 60 * 15,
  });
}
