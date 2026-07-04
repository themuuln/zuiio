"use server";

import { requireActionContext } from "@/lib/action-utils";
import type { AppPermission } from "@/lib/permissions";
import { revalidateEntity } from "@/lib/revalidate";

export async function createRole(formData: FormData) {
  const ctx = await requireActionContext("roles.manage");
  if ("error" in ctx) return ctx;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name?.trim()) {
    return { error: "Нэр шаардлагатай" };
  }

  const { error } = await ctx.supabase.from("roles").insert({
    organization_id: ctx.organizationId,
    name: name.trim(),
    description: description?.trim() || null,
    hierarchy_level: 99,
    is_system_role: false,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Энэ нэртэй үүрэг бүртгэгдсэн байна" };
    }
    return { error: error.message };
  }

  revalidateEntity("roles");
}

export async function updateRole(roleId: string, formData: FormData) {
  const ctx = await requireActionContext("roles.manage");
  if ("error" in ctx) return ctx;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name?.trim()) {
    return { error: "Нэр шаардлагатай" };
  }

  const { error } = await ctx.supabase
    .from("roles")
    .update({
      name: name.trim(),
      description: description?.trim() || null,
    })
    .eq("id", roleId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Энэ нэртэй үүрэг бүртгэгдсэн байна" };
    }
    return { error: error.message };
  }

  revalidateEntity("roles");
}

export async function deleteRole(roleId: string) {
  const ctx = await requireActionContext("roles.manage");
  if ("error" in ctx) return ctx;

  // Check if role has members
  const { count, error: countError } = await ctx.supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role_id", roleId);

  if (countError) {
    return { error: `Шалгахад алдаа гарлаа: ${countError.message}` };
  }

  if (count && count > 0) {
    return {
      error:
        "Энэ үүрэг дээр гишүүд байна. Эхлээд гишүүдийн үүргийг өөрчилнө үү.",
    };
  }

  const { error } = await ctx.supabase
    .from("roles")
    .delete()
    .eq("id", roleId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };

  revalidateEntity("roles");
}

export async function setRolePermissions(
  roleId: string,
  permissions: AppPermission[],
) {
  const ctx = await requireActionContext("roles.manage");
  if ("error" in ctx) return ctx;

  // Use the transactional RPC to avoid data loss if insert fails after delete
  const { data: result, error: rpcError } = await ctx.supabase.rpc(
    "set_role_permissions",
    { p_role_id: roleId, p_permissions: permissions },
  );

  if (rpcError) return { error: rpcError.message };

  if (typeof result === "object" && result !== null && "error" in result) {
    return { error: (result as { error: string }).error };
  }

  revalidateEntity("roles");
}

export async function updateUserRole(profileId: string, roleId: string | null) {
  const ctx = await requireActionContext("members.manage_role");
  if ("error" in ctx) return ctx;

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", profileId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };

  revalidateEntity("users");
}
