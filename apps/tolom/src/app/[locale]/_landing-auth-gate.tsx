"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
 * Uses plain fetch for stats (avoids bundling React Query on a public page).
 * If the user is logged in, it redirects to /dashboard in the background.
 * Marketing content is always visible — auth check is non-blocking.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [stats, setStats] = useState<{
    shops: number;
    vehiclesServiced: number;
    satisfaction: number;
  } | null>(null);

  // Fetch public stats with plain fetch — no React Query needed
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect logged-in users to dashboard (non-blocking, delayed for router init)
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!cancelled && user) {
          const timeout = setTimeout(() => {
            if (!cancelled) router.replace("/dashboard");
          }, 100);
          return () => clearTimeout(timeout);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children(stats)}</>;
}
