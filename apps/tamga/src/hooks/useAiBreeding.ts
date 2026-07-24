import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BreedingAdvice {
  compatibility_score: number;
  risk_level: "low" | "medium" | "high";
  inbreeding_risk: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  disclaimer: string;
}

export function useAiBreedingAdvice() {
  return useMutation({
    mutationFn: async ({
      sireId,
      damId,
    }: {
      sireId: string;
      damId: string;
    }): Promise<BreedingAdvice> => {
      const { data, error } = await supabase.functions.invoke("ai-breeding", {
        body: { sireId, damId },
      });

      if (error) {
        console.error("Error invoking ai-breeding:", error);
        throw error;
      }

      return data as BreedingAdvice;
    },
  });
}
