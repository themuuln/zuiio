import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Interfaces ──────────────────────────────────────────────

export interface HerdAnalytics {
  owner_id: string;
  total_horses: number;
  stallion_count: number;
  mare_count: number;
  gelding_count: number;
  foal_count: number;
  young_horses: number;
  senior_horses: number;
  first_horse_date: string | null;
  latest_horse_date: string | null;
}

export interface HealthAnalytics {
  total_horses: number;
  vaccination_rate: number;
  upcoming_vaccinations: number;
  total_health_events: number;
  health_events_by_type: Record<string, number>;
  recent_health_events: {
    horse_name: string;
    log_type: string;
    date: string;
    notes: string | null;
  }[];
}

export interface FinancialAnalytics {
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_revenue: number;
  average_sale_price: number;
  revenue_by_type: Record<string, number>;
}

export interface BreedingAnalytics {
  active_breedings: number;
  total_breedings: number;
  foaling_success_rate: number;
  breeding_records: {
    sire_name: string | null;
    dam_name: string | null;
    breeding_date: string;
    expected_foaling_date: string | null;
    status: string;
  }[];
}

// ── Hooks ───────────────────────────────────────────────────

export function useHerdAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ["analytics_herd", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("herd_analytics_view")
        .select("*")
        .eq("owner_id", userId)
        .single();

      if (error) {
        console.error("Error fetching herd analytics:", error);
        throw error;
      }

      return data as HerdAnalytics;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHealthAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ["analytics_health", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc("get_health_analytics", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching health analytics:", error);
        throw error;
      }

      return data as HealthAnalytics;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ["analytics_financial", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc("get_financial_analytics", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching financial analytics:", error);
        throw error;
      }

      return data as FinancialAnalytics;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBreedingAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ["analytics_breeding", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc("get_breeding_analytics", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching breeding analytics:", error);
        throw error;
      }

      return data as BreedingAnalytics;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}