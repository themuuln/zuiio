import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface UseOnboardingReturn {
  isOnboarded: boolean | null;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { user, loading: authLoading } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsOnboarded(false);
      setIsLoading(false);
      return;
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const complete = meta?.onboarding_complete === true;
    setIsOnboarded(complete);
    setIsLoading(false);
  }, [user, authLoading]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });

    if (error) {
      console.error("Failed to complete onboarding:", error);
      throw error;
    }

    setIsOnboarded(true);
  }, [user]);

  return { isOnboarded, isLoading, completeOnboarding };
}
