import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface UserSession {
  id: string;
  user_id: string;
  device_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  last_active: string;
  created_at: string;
  is_current: boolean;
}

export function useSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ["sessions", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: currentSession } = await supabase.auth.getSession();
      const currentSessionId = currentSession?.session?.access_token;

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_active", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((s: any) => ({
        ...s,
        is_current: s.id === currentSessionId,
      })) as UserSession[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
