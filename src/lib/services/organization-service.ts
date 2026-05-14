import { revalidateTag } from "next/cache";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { Organization } from "@/lib/database.types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateOrganizationParams,
  UpdateOrganizationParams,
} from "@/lib/types";

export async function createOrganization(
  params: CreateOrganizationParams,
  userId: string,
): Promise<Organization> {
  const { name, slug } = params;

  if (!name?.trim()) throw new ValidationError("Organization name is required");
  if (!slug?.trim()) throw new ValidationError("Organization slug is required");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("An organization with this slug already exists");
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      settings: {},
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  // Create roles, branch, membership, profile
  const { data: adminRole, error: adminRoleError } = await supabase
    .from("roles")
    .insert({
      organization_id: org.id,
      name: "Admin",
      is_system: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (adminRoleError || !adminRole) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(adminRoleError?.message ?? "Failed to create Admin role");
  }

  const { error: mechanicRoleError } = await supabase.from("roles").insert({
    organization_id: org.id,
    name: "Mechanic",
    is_system: true,
    created_by: userId,
    updated_by: userId,
  });

  if (mechanicRoleError) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(
      mechanicRoleError?.message ?? "Failed to create Mechanic role",
    );
  }

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .insert({
      organization_id: org.id,
      name: "Main Branch",
      is_main: true,
      settings: {},
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (branchError || !branch) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(branchError?.message ?? "Failed to create default branch");
  }

  const { error: memberError } = await supabase
    .from("organization_users")
    .insert({
      organization_id: org.id,
      user_id: userId,
      role_id: adminRole.id,
      branch_id: branch.id,
      is_primary: true,
    });

  if (memberError) {
    throw new Error(
      memberError.message ?? "Failed to add user to organization",
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    organization_id: org.id,
    branch_id: branch.id,
    is_active: true,
    full_name: params.userFullName ?? null,
  });

  if (profileError) {
    console.error("Failed to upsert profile:", profileError.message);
  }

  try {
    await supabase.rpc("create_default_subscription", {
      target_org_id: org.id,
    });
  } catch (subError) {
    console.error("Failed to create default subscription:", subError);
  }

  return org;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const supabase = await createClient();

  return withCache(
    ["getOrganization", orgId],
    async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        throw new NotFoundError("Organization not found");
      }

      return data;
    },
    {
      tags: [cacheTags.branches(orgId)],
      revalidate: cacheDurations.branches,
    },
  );
}

export async function getUserOrganization(
  userId: string,
): Promise<Organization | null> {
  const supabase = await createClient();

  return withCache(
    ["getUserOrganization", userId],
    async () => {
      const { data: membership } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!membership) return null;

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .is("deleted_at", null)
        .single();

      return org ?? null;
    },
    {
      tags: [cacheTags.organizationUsers(userId)],
      revalidate: cacheDurations.organizationUsers,
    },
  );
}

export async function updateOrganization(
  orgId: string,
  params: UpdateOrganizationParams,
): Promise<Organization> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.logoUrl !== undefined) updates.logo_url = params.logoUrl;
  if (params.settings !== undefined) updates.settings = params.settings;

  updates.updated_by = (await supabase.auth.getUser()).data.user?.id;

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) {
    throw new NotFoundError("Organization not found");
  }

  revalidateTag(cacheTags.branches(orgId), "max");

  return data;
}
