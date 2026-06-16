import { GearSix } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  type RolePermission,
  RolesClient,
} from "@/components/roles/roles-client";
import { requireAppContext } from "@/lib/erp";

export default async function RolesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const rolesResult = await supabase
    .from("roles")
    .select("id, name, description, hierarchy_level, is_system_role")
    .eq("organization_id", organizationId)
    .order("hierarchy_level", { ascending: true });

  const roles = rolesResult.data ?? [];
  const roleIds = roles.map((r) => r.id);

  let rolePermissions: RolePermission[] = [];
  if (roleIds.length > 0) {
    const { data } = await supabase
      .from("role_permissions")
      .select("id, role_id, permission")
      .in("role_id", roleIds);
    rolePermissions = data ?? [];
  }

  if (roles.length === 0) {
    return (
      <PageShell
        title="Үүрэг, эрхүүд"
        description="Байгууллагын гишүүдийн үүрэг болон эрхүүдийг удирдах"
      >
        <ErpEmptyState
          icon={<GearSix className="size-4" />}
          title="Үүрэг олдсонгүй"
          description="Энэ байгууллагад үүрэг бүртгэгдээгүй байна."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Үүрэг, эрхүүд"
      description="Байгууллагын гишүүдийн үүрэг болон эрхүүдийг удирдах"
    >
      <RolesClient roles={roles} rolePermissions={rolePermissions} />
    </PageShell>
  );
}
