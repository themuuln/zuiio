import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev mode: skip Supabase, auto-authenticate.
    if (__DEV__) {
      setSession({
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          email: "dev@tamga.local",
          user_metadata: { display_name: "Development User" },
        },
        access_token: "dev-token",
      } as unknown as Session); // Dev mock — no real Supabase session
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}
