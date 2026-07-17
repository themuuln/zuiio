import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRevokeSession(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", userId] });
    },
  });
}

export function useRevokeAllSessions(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");

      // Get current session to keep it
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", userId)
        .neq("id", session?.access_token ?? "none");

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", userId] });
    },
  });
}
