"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PublicStats {
  shops: number;
  vehiclesServiced: number;
  satisfaction: number;
}

interface AuthGateProps {
  children: (stats: PublicStats | null) => React.ReactNode;
}

/**
 * AuthGate renders content immediately (no blocking spinner).
 * If the user is logged in, it redirects to /dashboard in the background.
 * Marketing content is always visible — auth check is non-blocking.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);

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

  // Fetch public stats (non-blocking)
  useEffect(() => {
    fetch("/api/public/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return <>{children(stats)}</>;
}
