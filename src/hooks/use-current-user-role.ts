"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  fullName: string | null;
  roleName: string | null;
  organizationId: string | null;
  branchId: string | null;
}

type RoleName = "Admin" | "Mechanic" | null;

export function useCurrentUserRole() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          id: data.id ?? "",
          fullName: data.fullName ?? null,
          roleName: data.roleName ?? null,
          organizationId: data.organizationId ?? null,
          branchId: data.branchId ?? null,
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const role: RoleName =
    profile?.roleName === "Admin" || profile?.roleName === "Mechanic"
      ? profile.roleName
      : null;

  return { profile, role, loading, isAdmin: role === "Admin", isMechanic: role === "Mechanic" };
}
