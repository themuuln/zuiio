"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { prefetchCriticalRoutes } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side side effects for the landing page:
 * 1. Prefetch critical dashboard/auth routes for instant navigation
 * 2. Auto-redirect logged-in users to dashboard (non-blocking, delayed)
 *
 * Renders nothing — only side effects.
 */
export function HomeClientContent() {
  const router = useRouter();

  useEffect(() => {
    prefetchCriticalRoutes();

    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (user) {
          const timeout = setTimeout(() => {
            router.replace("/dashboard");
          }, 100);
          return () => clearTimeout(timeout);
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
