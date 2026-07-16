"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createZuiioClient } from "./client";
import type { ZuiioUser, ZuiioOrg } from "./client";

/**
 * Hook for Zuiio authentication state.
 */
export function useZuiioAuth(supabase: SupabaseClient) {
  const [user, setUser] = useState<ZuiioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const client = createZuiioClient(supabase);

  useEffect(() => {
    void client.getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [client]);

  const signOut = useCallback(async () => {
    await client.signOut();
    setUser(null);
  }, [client]);

  return { user, loading, signOut };
}

/**
 * Hook for user's organizations.
 */
export function useZuiioOrg(supabase: SupabaseClient) {
  const [orgs, setOrgs] = useState<ZuiioOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const client = createZuiioClient(supabase);

  useEffect(() => {
    void client.getOrgs().then((o) => {
      setOrgs(o);
      setLoading(false);
    });
  }, [client]);

  return { orgs, loading };
}
