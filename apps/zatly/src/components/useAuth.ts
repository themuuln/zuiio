"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        setUser(user);
        setLoading(false);
      } else if (process.env.NODE_ENV === "development") {
        const email = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL;
        const password = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD;
        if (email && password) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (!cancelled) {
            if (error) {
              console.warn("[dev] Auto-login failed:", error.message);
              setLoading(false);
            }
            // On success, onAuthStateChange will set user + loading
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { user, loading, signOut };
}
