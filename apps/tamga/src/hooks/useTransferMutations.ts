import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const DEV_USER_ID = "11111111-1111-1111-1111-111111111111";

interface InitiateTransferInput {
  horse_id: string;
  to_phone: string;
  notes?: string;
}

function generateTransferCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useInitiateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InitiateTransferInput) => {
      const transferCode = generateTransferCode();

      const { data, error } = await supabase
        .from("ownership_transfers")
        .insert({
          horse_id: input.horse_id,
          from_owner_id: DEV_USER_ID,
          to_phone: input.to_phone,
          notes: input.notes || null,
          transfer_code: transferCode,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, transfer_code: transferCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function useAcceptTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transferId,
      horseId,
      code,
    }: {
      transferId: string;
      horseId: string;
      code: string;
    }) => {
      // Verify transfer code
      const { data: transfer, error: fetchError } = await supabase
        .from("ownership_transfers")
        .select("transfer_code, status")
        .eq("id", transferId)
        .single();

      if (fetchError) throw fetchError;
      if (transfer.status !== "pending") {
        throw new Error("Энэ шилжүүлэг аль хэдийн дууссан");
      }
      if (transfer.transfer_code !== code) {
        throw new Error("Шилжүүлгийн код буруу байна");
      }

      // Update transfer status
      const { error: updateError } = await supabase
        .from("ownership_transfers")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", transferId);

      if (updateError) throw updateError;

      // Change horse ownership
      const { error: horseError } = await supabase
        .from("horses")
        .update({ owner_id: DEV_USER_ID })
        .eq("id", horseId);

      if (horseError) throw horseError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("ownership_transfers")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", transferId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("ownership_transfers")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", transferId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}
