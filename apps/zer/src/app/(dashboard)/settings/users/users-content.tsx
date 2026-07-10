"use client";

import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/erp/page-shell";
import { MembersClient } from "@/components/roles/members-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useOrgSettings } from "@/lib/org-settings-context";
import { withDbCapture } from "@zuiio/capture";
import { getAuthUsers } from "./actions";

export function UsersContent() {
  const { organizationId } = useOrgSettings();

  const { data, isLoading } = useQuery({
    queryKey: ["settings:users", organizationId],
    queryFn: async () => {
      const supabase = createClient();

      const [profilesResult, authUsersResult, rolesResult, branchesResult, userResult, permissionsResult] =
        await Promise.allSettled([
          withDbCapture(
            "settings:users:profiles",
            supabase
              .from("profiles")
              .select("id, full_name, role, role_id, branch_id")
              .eq("organization_id", organizationId)
              .order("created_at", { ascending: true }),
          ),
          getAuthUsers(),
          withDbCapture(
            "settings:users:roles",
            supabase
              .from("roles")
              .select("id, name, is_system_role")
              .eq("organization_id", organizationId)
              .order("hierarchy_level", { ascending: true }),
          ),
          withDbCapture(
            "settings:users:branches",
            supabase
              .from("branches")
              .select("id, name")
              .eq("organization_id", organizationId)
              .order("name"),
          ),
          supabase.auth.getUser(),
          supabase.rpc("get_user_permissions"),
        ]);

      if (profilesResult.status === "rejected") {
        throw profilesResult.reason;
      }
      const profiles = profilesResult.value.data ?? [];

      const authUsers =
        authUsersResult.status === "fulfilled" ? authUsersResult.value : [];

      const roles =
        rolesResult.status === "fulfilled"
          ? (rolesResult.value.data ?? [])
          : [];

      const branches =
        branchesResult.status === "fulfilled"
          ? (branchesResult.value.data ?? [])
          : [];

      const currentUser =
        userResult.status === "fulfilled"
          ? userResult.value.data?.user
          : null;

      const permissions =
        permissionsResult.status === "fulfilled"
          ? (permissionsResult.value.data ?? [])
          : [];

      const emailMap = new Map<string, string>();
      for (const authUser of authUsers) {
        emailMap.set(authUser.id, authUser.email);
      }

      const currentUserId = currentUser?.id ?? "";

      const members = profiles.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        role_id: profile.role_id,
        branch_id: profile.branch_id,
        email: emailMap.get(profile.id) ?? "",
      }));

      return {
        members,
        roles,
        branches,
        currentUserId,
        canManageRole: (permissions as string[]).includes("members.manage_role"),
        canManageBranches: (permissions as string[]).includes("settings.manage"),
        canInvite: (permissions as string[]).includes("members.invite"),
        canRemove: (permissions as string[]).includes("members.remove"),
      };
    },
    enabled: !!organizationId,
  });

  return (
    <PageShell
      title="Хэрэглэгчид"
      description="Байгууллагын гишүүд болон тэдний үүрэг, салбарын хандалт"
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full rounded-md" />
              <div className="mt-2 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            </div>
          ) : data ? (
            <MembersClient
              members={data.members}
              roles={data.roles}
              branches={data.branches}
              currentUserId={data.currentUserId}
              canManageRole={data.canManageRole}
              canManageBranches={data.canManageBranches}
              canInvite={data.canInvite}
              canRemove={data.canRemove}
            />
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
