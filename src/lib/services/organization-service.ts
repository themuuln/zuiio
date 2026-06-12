import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { createAuditLog } from "@/lib/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import type {
  CreateOrganizationParams,
  Organization,
  UpdateOrganizationParams,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

export async function createOrganization(
  db: SupabaseClient,
  params: CreateOrganizationParams,
  userId: string,
): Promise<Organization> {
  const { name, slug } = params;

  if (!name?.trim()) throw new ValidationError("Organization name is required");
  if (!slug?.trim()) throw new ValidationError("Organization slug is required");

  const supabase = db;

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
      settings: { language: "mn" },
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, name, slug, logo_url, settings, is_active, branch_limit, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  // Create roles, branch, membership, profile
  // The database trigger automatically seeds standard roles and permissions.
  // Fetch the created "Org Owner" role.
  const { data: adminRole, error: adminRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("organization_id", org.id)
    .eq("name", "Org Owner")
    .is("deleted_at", null)
    .single();

  if (adminRoleError || !adminRole) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(
      adminRoleError?.message ?? "Failed to resolve Org Owner role",
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
    reportServerError("Failed to upsert profile:", profileError.message);
  }

  try {
    await supabase.rpc("create_default_subscription", {
      target_org_id: org.id,
    });
  } catch (subError) {
    reportServerError("Failed to create default subscription:", subError);
  }

  return org as unknown as Organization;
}

export async function getOrganization(
  db: SupabaseClient,
  orgId: string,
): Promise<Organization> {
  const supabase = db;

  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, logo_url, settings, is_active, branch_limit, created_by, updated_by, created_at, updated_at, deleted_at",
    )
    .eq("id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError("Organization not found");
  }

  return data as unknown as Organization;
}

export async function getUserOrganization(
  db: SupabaseClient,
  userId: string,
): Promise<Organization | null> {
  const supabase = db;

  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", userId)
    .is("removed_at", null)
    .maybeSingle();

  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, logo_url, settings, is_active, branch_limit, created_at",
    )
    .eq("id", membership.organization_id)
    .is("deleted_at", null)
    .single();

  return (org ?? null) as unknown as Organization | null;
}

export async function updateOrganization(
  db: SupabaseClient,
  orgId: string,
  params: UpdateOrganizationParams,
): Promise<Organization> {
  const supabase = db;

  const fieldMap: FieldMap<UpdateOrganizationParams> = {
    columns: {
      name: "name",
      logoUrl: "logo_url",
      settings: "settings",
      sharingEnabled: "sharing_enabled",
    },
    transforms: {
      name: trimField,
    },
  };

  const updates = buildUpdates(params, fieldMap);
  updates.updated_by = (await supabase.auth.getUser()).data.user?.id;

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId)
    .is("deleted_at", null)
    .select(
      "id, name, slug, logo_url, settings, is_active, sharing_enabled, branch_limit, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new NotFoundError("Organization not found");
  }

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "organizations",
    record_id: orgId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.branches(orgId), "max");

  return data as unknown as Organization;
}
