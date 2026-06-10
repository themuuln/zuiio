"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePublicStats } from "@/lib/queries/use-public-stats";
import { createClient } from "@/lib/supabase/client";

interface AuthGateProps {
  children: (
    stats: {
      shops: number;
      vehiclesServiced: number;
      satisfaction: number;
    } | null,
  ) => React.ReactNode;
}

/**
 * AuthGate renders content immediately (no blocking spinner).
 * If the user is logged in, it redirects to /dashboard in the background.
 * Marketing content is always visible — auth check is non-blocking.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const { data: stats = null } = usePublicStats();

  // Redirect logged-in users to dashboard (non-blocking, delayed for router init)
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!cancelled && user) {
          // Delay router navigation to ensure router is initialized
          const timeout = setTimeout(() => {
            if (!cancelled) router.replace("/dashboard");
          }, 100);
          return () => clearTimeout(timeout);
        }
      })
      .catch(() => {
        // Auth check failed — stay on marketing page
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children(stats)}</>;
}
