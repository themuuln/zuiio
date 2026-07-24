import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

export interface DigitalCertificate {
  id: string;
  horse_id: string;
  owner_user_id: string;
  issued_at: string;
  is_active: boolean;
  verification: string | null;
  created_at: string;
  owner_name: string | null;
  horse_name: string | null;
  expiry_date: string | null;
  status: string | null;
  qr_code: string | null;
  previous_owner_id: string | null;
  updated_at: string;
}

export function useCertificates(horseId: string | undefined) {
  return useQuery({
    queryKey: ["certificates", horseId],
    queryFn: async () => {
      if (!horseId) return [];
      const { data, error } = await supabase
        .from("digital_certificates")
        .select("*")
        .eq("horse_id", horseId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as DigitalCertificate[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cert: {
      horse_id: string;
      horse_name?: string;
      owner_name?: string;
      verification?: string;
    }) => {
      const { data, error } = await supabase
        .from("digital_certificates")
        .insert({
          horse_id: cert.horse_id,
          owner_user_id: DEV_USER_ID,
          horse_name: cert.horse_name ?? null,
          owner_name: cert.owner_name ?? null,
          verification: cert.verification ?? null,
          is_active: true,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["certificates", variables.horse_id] });
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, horseId }: { id: string; horseId: string }) => {
      const { error } = await supabase
        .from("digital_certificates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["certificates", variables.horseId] });
    },
  });
}
