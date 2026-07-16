import { createAdminClient } from "@/lib/supabase/server";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role_id: string;
  role_name?: string;
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

/** Narrow a Supabase result row to an object we can index into. */
function toRow(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object")
    return value as Record<string, unknown>;
  return null;
}

/** Extract the `name` field from a nested `roles` join. */
function roleName(row: Record<string, unknown>): string | null {
  const roles = row["roles"];
  if (roles && typeof roles === "object" && "name" in roles) {
    const name = (roles as Record<string, unknown>)["name"];
    if (typeof name === "string") return name;
  }
  return null;
}

/**
 * Create a new organization and make the creator the owner.
 */
export async function createOrganization(
  name: string,
  slug: string,
  createdBy: string,
): Promise<Organization> {
  const admin = await createAdminClient();

  // Get owner role
  const { data: ownerRole } = await admin
    .from("roles")
    .select("id")
    .eq("name", "owner")
    .single();

  if (!ownerRole) throw new Error("Owner role not found");

  const ownerRow = toRow(ownerRole);
  const roleId = ownerRow?.["id"];
  if (typeof roleId !== "string") throw new Error("Owner role not found");

  // Create org
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug, created_by: createdBy })
    .select()
    .single();

  if (orgError) throw orgError;

  const orgRow = toRow(org);
  if (!orgRow) throw new Error("Organization creation failed");

  // Add creator as owner
  await admin.from("org_memberships").insert({
    org_id: orgRow["id"],
    user_id: createdBy,
    role_id: roleId,
  });

  return {
    id: String(orgRow["id"]),
    name: String(orgRow["name"]),
    slug: String(orgRow["slug"]),
    created_by: typeof orgRow["created_by"] === "string" ? orgRow["created_by"] : null,
    created_at: String(orgRow["created_at"]),
  };
}

/**
 * Invite a user to an organization by email.
 * Returns the invite token for the email link.
 */
export async function inviteToOrganization(
  orgId: string,
  email: string,
  roleName: string,
  invitedBy: string,
): Promise<OrgInvite> {
  const admin = await createAdminClient();

  // Get role
  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  const roleRow = toRow(role);
  const roleId = roleRow?.["id"];
  if (typeof roleId !== "string") {
    throw new Error(`Role '${roleName}' not found`);
  }

  const { data: invite, error } = await admin
    .from("org_invites")
    .insert({
      org_id: orgId,
      email,
      role_id: roleId,
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error) throw error;

  const inviteRow = toRow(invite);
  if (!inviteRow) throw new Error("Invite creation failed");

  return {
    id: String(inviteRow["id"]),
    org_id: String(inviteRow["org_id"]),
    email: String(inviteRow["email"]),
    role_id: String(inviteRow["role_id"]),
    invited_by: typeof inviteRow["invited_by"] === "string" ? inviteRow["invited_by"] : null,
    token: String(inviteRow["token"]),
    expires_at: String(inviteRow["expires_at"]),
    accepted_at: typeof inviteRow["accepted_at"] === "string" ? inviteRow["accepted_at"] : null,
    created_at: String(inviteRow["created_at"]),
  };
}

/**
 * Accept an organization invite.
 */
export async function acceptInvite(
  token: string,
  userId: string,
): Promise<{ orgId: string; error?: string }> {
  const admin = await createAdminClient();

  // Find the invite
  const { data: invite } = await admin
    .from("org_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  const inviteRow = toRow(invite);
  if (!inviteRow) {
    return {
      orgId: "",
      error: "Урилга олдсонгүй эсвэл хугацаа нь дууссан байна.",
    };
  }

  const inviteOrgId = String(inviteRow["org_id"]);

  // Check if already a member
  const { data: existing } = await admin
    .from("org_memberships")
    .select("id")
    .eq("org_id", inviteOrgId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return {
      orgId: inviteOrgId,
      error: "Та аль хэдийн энэ байгууллагын гишүүн байна.",
    };
  }

  // Add membership
  const { error: memberError } = await admin
    .from("org_memberships")
    .insert({
      org_id: inviteOrgId,
      user_id: userId,
      role_id: String(inviteRow["role_id"]),
      invited_by: typeof inviteRow["invited_by"] === "string" ? inviteRow["invited_by"] : null,
    });

  if (memberError) {
    return { orgId: "", error: "Гишүүн болоход алдаа гарлаа." };
  }

  // Mark invite as accepted
  await admin
    .from("org_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", String(inviteRow["id"]));

  return { orgId: inviteOrgId };
}

/**
 * Remove a member from an organization.
 * Protects the owner role from removal.
 */
export async function removeMember(
  orgId: string,
  userId: string,
): Promise<void> {
  const admin = await createAdminClient();

  // Check if the member has the owner role
  const { data: membership } = await admin
    .from("org_memberships")
    .select("role_id, roles!inner(name)")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  const row = toRow(membership);
  if (row) {
    const role = roleName(row);
    if (role === "owner") {
      throw new Error("Owner role cannot be removed from an organization.");
    }
  }

  await admin
    .from("org_memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRoleName: string,
): Promise<void> {
  const admin = await createAdminClient();

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("name", newRoleName)
    .single();

  const roleRow = toRow(role);
  const roleId = roleRow?.["id"];
  if (typeof roleId !== "string") {
    throw new Error(`Role '${newRoleName}' not found`);
  }

  await admin
    .from("org_memberships")
    .update({ role_id: roleId })
    .eq("org_id", orgId)
    .eq("user_id", userId);
}

/**
 * Get pending invites for an organization.
 */
export async function getOrgInvites(orgId: string): Promise<OrgInvite[]> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("org_invites")
    .select("*, roles!inner(name)")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  return (data ?? [])
    .map(toRow)
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((i) => ({
      id: String(i["id"]),
      org_id: String(i["org_id"]),
      email: String(i["email"]),
      role_id: String(i["role_id"]),
      role_name: roleName(i) ?? undefined,
      invited_by: typeof i["invited_by"] === "string" ? i["invited_by"] : null,
      token: String(i["token"]),
      expires_at: String(i["expires_at"]),
      accepted_at: typeof i["accepted_at"] === "string" ? i["accepted_at"] : null,
      created_at: String(i["created_at"]),
    }));
}
