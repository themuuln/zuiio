import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface UserProfile {
  organizationId: string;
  branchId: string | null;
  roleId: string | null;
}

export function useProfile() {
  const { state } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.status !== "authenticated") {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userId = state.session.user.id;

    supabase
      .from("profiles")
      .select("organization_id, role_id, branch_id")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.organization_id) {
          console.error("Failed to load profile:", error);
          setLoading(false);
          return;
        }
        setProfile({
          organizationId: data.organization_id,
          branchId: data.branch_id ?? null,
          roleId: data.role_id,
        });
        setLoading(false);
      });
  }, [state]);

  return { profile, loading };
}
