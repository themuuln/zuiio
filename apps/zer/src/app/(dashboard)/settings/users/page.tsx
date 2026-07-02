import { PageShell } from "@/components/erp/page-shell";
import { MembersClient } from "@/components/roles/members-client";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";

export default async function UsersPage() {
  const { supabase, organizationId, userId, permissions } =
    await requireAppContext();

  const [profilesResult, authResult, rolesResult, branchesResult] =
    await Promise.allSettled([
      supabase
        .from("profiles")
        .select("id, full_name, role, role_id, branch_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      createServiceClient().auth.admin.listUsers(),
      supabase
        .from("roles")
        .select("id, name, is_system_role")
        .eq("organization_id", organizationId)
        .order("hierarchy_level", { ascending: true }),
      supabase
        .from("branches")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("name"),
    ]);

  if (profilesResult.status === "rejected") {
    console.error("Profiles query failed:", profilesResult.reason);
  }
  const profiles =
    profilesResult.status === "fulfilled"
      ? (profilesResult.value.data ?? [])
      : [];

  if (authResult.status === "rejected") {
    console.error("Auth users query failed:", authResult.reason);
  }
  const authUsers =
    authResult.status === "fulfilled"
      ? (authResult.value.data?.users ?? [])
      : [];

  if (rolesResult.status === "rejected") {
    console.error("Roles query failed:", rolesResult.reason);
  }
  const roles =
    rolesResult.status === "fulfilled" ? (rolesResult.value.data ?? []) : [];

  const branches =
    branchesResult.status === "fulfilled"
      ? (branchesResult.value.data ?? [])
      : [];

  const emailMap = new Map<string, string>();
  for (const authUser of authUsers) {
    if (authUser.email) {
      emailMap.set(authUser.id, authUser.email);
    }
  }

  const members = profiles.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    role_id: profile.role_id,
    branch_id: profile.branch_id,
    email: emailMap.get(profile.id) ?? "",
  }));

  const canManageBranches = permissions.includes("settings.manage");

  return (
    <PageShell
      title="Хэрэглэгчид"
      description="Байгууллагын гишүүд болон тэдний үүрэг, салбарын хандалт"
    >
      <Card>
        <CardContent className="p-0">
          <MembersClient
            members={members}
            roles={roles}
            branches={branches}
            currentUserId={userId}
            canManageRole={permissions.includes("members.manage_role")}
            canManageBranches={canManageBranches}
            canInvite={permissions.includes("members.invite")}
            canRemove={permissions.includes("members.remove")}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
