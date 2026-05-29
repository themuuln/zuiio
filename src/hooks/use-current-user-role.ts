"use client";

import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  fullName: string | null;
  roleName: string | null;
  organizationId: string | null;
  branchId: string | null;
}

type RoleName = "Admin" | "Mechanic" | null;

const profileKeys = {
  current: () => ["profile", "current"] as const,
};

export function useCurrentUserRole() {
  const { data: profile, isLoading: loading } = useQuery<UserProfile | null>({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data.id ?? "",
        fullName: data.fullName ?? null,
        roleName: data.roleName ?? null,
        organizationId: data.organizationId ?? null,
        branchId: data.branchId ?? null,
      };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const role: RoleName =
    profile?.roleName === "Admin" || profile?.roleName === "Mechanic"
      ? profile.roleName
      : null;

  return {
    profile,
    role,
    loading,
    isAdmin: role === "Admin",
    isMechanic: role === "Mechanic",
  };
}
