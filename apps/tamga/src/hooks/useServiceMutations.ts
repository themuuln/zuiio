import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CreateBookingInput {
  horse_id: string;
  provider_id: string;
  service_type: string;
  date: string;
  time: string;
  notes?: string;
}

export function useCreateBooking(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_bookings")
        .insert({
          ...input,
          owner_id: userId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-bookings", userId] });
    },
  });
}

export function useUpdateBookingStatus(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-bookings", userId] });
    },
  });
}
