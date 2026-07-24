import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export function useOnboarding() {
  const { user } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const completed = user.user_metadata?.onboarding_complete === true;
    setIsOnboarded(completed);
    setIsLoading(false);
  }, [user]);

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });
    setIsOnboarded(true);
  };

  return { isOnboarded, isLoading, completeOnboarding };
}
