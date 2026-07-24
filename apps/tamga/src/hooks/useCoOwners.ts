import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CoOwnership {
  id: string;
  horse_id: string;
  owner_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  co_owner_name: string | null;
  phone: string | null;
  permissions: string[] | null;
}

const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

// Co-owners for a specific horse
export function useCoOwners(horseId: string | undefined) {
  return useQuery({
    queryKey: ["coOwners", horseId],
    queryFn: async () => {
      if (!horseId) return [];
      const { data, error } = await supabase
        .from("co_ownerships")
        .select("*")
        .eq("horse_id", horseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CoOwnership[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

// Invite co-owner
export function useInviteCoOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      horseId,
      coOwnerName,
      phone,
      role,
    }: {
      horseId: string;
      coOwnerName: string;
      phone: string;
      role: string;
    }) => {
      const { data, error } = await supabase
        .from("co_ownerships")
        .insert({
          horse_id: horseId,
          owner_id: DEV_USER_ID,
          co_owner_name: coOwnerName,
          phone,
          role,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coOwners", variables.horseId] });
    },
  });
}

// Update co-owner role
export function useUpdateCoOwnerRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
      horseId,
    }: {
      id: string;
      role: string;
      horseId: string;
    }) => {
      const { error } = await supabase
        .from("co_ownerships")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coOwners", variables.horseId] });
    },
  });
}

// Revoke co-owner access (delete)
export function useRevokeCoOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      horseId,
    }: {
      id: string;
      horseId: string;
    }) => {
      const { error } = await supabase
        .from("co_ownerships")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coOwners", variables.horseId] });
    },
  });
}
