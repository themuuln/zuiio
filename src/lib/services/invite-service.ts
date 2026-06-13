import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuditLog } from "@/lib/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { InviteUserParams, OrgInvite } from "@/lib/types";

function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function createInvite(
  db: SupabaseClient,
  orgId: string,
  params: InviteUserParams,
  invitedByUserId: string,
): Promise<OrgInvite> {
  const { email, roleId, message } = params;

  if (!email?.trim()) {
    throw new ValidationError("Email is required");
  }

  const supabase = db;

  const existing = await supabase
    .from("org_invites")
    .select("id, status")
    .eq("organization_id", orgId)
    .eq("email", email.toLowerCase().trim())
    .neq("status", "accepted")
    .maybeSingle();

  if (existing?.data) {
    throw new ConflictError("An active invite already exists for this email");
  }

  const token = generateToken();

  const { data, error } = await supabase
    .from("org_invites")
    .insert({
      organization_id: orgId,
      email: email.toLowerCase().trim(),
      role_id: roleId ?? null,
      token,
      status: "pending",
      invited_by: invitedByUserId,
      message: message?.trim() ?? null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select(
      "id, organization_id, email, role_id, token, status, invited_by, message, expires_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invite");
  }

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "org_invites",
    record_id: data.id,
    user_id: invitedByUserId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  return data;
}

/**
 * Finds all pending invites for a given email or phone number.
 *
 * When `identifier` looks like a phone number (all digits, possibly with +),
 * it searches `org_invites.email` using a LIKE match (e.g. the invited email
 * might be "90409040@gmail.com" for phone "90409040"). Otherwise it does an
 * exact match on the email column.
 */
/**
 * Finds all pending invites for a given email or phone number.
 * Uses the service role client to bypass RLS (new users who haven't joined
 * an org yet can't query org_invites via their user session).
 *
 * When `identifier` looks like a phone number (all digits, possibly with +),
 * searches `org_invites.email` using a LIKE match. Otherwise does an exact
 * match on the email column.
 */
export async function getPendingInvitesForEmail(
  identifier: string,
): Promise<
  Array<OrgInvite & { organization_name: string; inviter_name: string | null }>
> {
  // Use service role to bypass RLS — new users aren't org members yet
  const supabase = await createServiceRoleClient();

  const cleaned = identifier.toLowerCase().trim();
  const isPhone = /^\+?\d{7,15}$/.test(cleaned);

  let query = supabase
    .from("org_invites")
    .select(
      `id, organization_id, email, role_id, token, status, invited_by, message, expires_at, created_at, updated_at,
      organizations!inner(name)`,
    )
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (isPhone) {
    // Phone number — match against emails that CONTAIN the digits
    // e.g. phone "90409040" matches "90409040@gmail.com" or "user90409040@example.com"
    query = query.ilike("email", `%${cleaned.replace(/\D/g, "")}%`);
  } else {
    // Email — exact match
    query = query.eq("email", cleaned);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    reportServerError("Failed to fetch pending invites:", error);
    return [];
  }

  return (data ?? []).map((invite: Record<string, unknown>) => {
    const orgName = Array.isArray(invite.organizations)
      ? (invite.organizations[0] as { name?: string })?.name
      : (invite.organizations as { name?: string } | null)?.name;

    return {
      ...invite,
      organization_name: orgName ?? "Unknown",
      inviter_name: null,
    };
  }) as Array<
    OrgInvite & { organization_name: string; inviter_name: string | null }
  >;
}

export async function getOrgInvites(orgId: string): Promise<OrgInvite[]> {
  // Use service role to bypass RLS — consistent with getPendingInvitesForEmail.
  // The API route already verifies org membership via createRouteHandler.
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("org_invites")
    .select(
      "id, organization_id, email, role_id, token, status, invited_by, message, expires_at, created_at, updated_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch invites");
  }

  return data ?? [];
}

export async function getInviteByToken(
  db: SupabaseClient,
  token: string,
): Promise<
  OrgInvite & { organization_name: string; inviter_name: string | null }
> {
  const supabase = db;

  const { data, error } = await supabase
    .from("org_invites")
    .select(
      `*,
      organizations!inner(name),
      inviter:invited_by(full_name)`,
    )
    .eq("token", token)
    .single();

  if (error || !data) {
    throw new NotFoundError("Invite not found or expired");
  }

  const orgName = Array.isArray(data.organizations)
    ? data.organizations[0]?.name
    : (data.organizations as unknown as { name: string } | null)?.name;

  const inviterName = Array.isArray(data.inviter)
    ? data.inviter[0]?.full_name
    : (data.inviter as unknown as { full_name: string | null } | null)
        ?.full_name;

  return {
    ...data,
    organization_name: orgName ?? "Unknown",
    inviter_name: inviterName ?? null,
  };
}

export async function redeemInvite(
  db: SupabaseClient,
  token: string,
  userId: string,
): Promise<{ organizationId: string }> {
  const supabase = db;

  const { data, error } = await supabase.rpc("accept_invite", {
    invite_token: token,
    accepting_user_id: userId,
  });

  if (error) {
    throw new ValidationError(error.message ?? "Failed to accept invite");
  }

  const result = data as {
    success: boolean;
    error?: string;
    organization_id?: string;
  };

  if (!result.success) {
    throw new ValidationError(result.error ?? "Failed to accept invite");
  }

  if (!result.organization_id) {
    throw new ValidationError("No organization ID returned from invitation");
  }

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "org_invites",
    record_id: token,
    user_id: userId,
    organization_id: result.organization_id,
    new_data: { status: "accepted", accepting_user_id: userId },
  });

  return { organizationId: result.organization_id };
}

export async function cancelInvite(
  db: SupabaseClient,
  orgId: string,
  inviteId: string,
): Promise<void> {
  const supabase = db;

  const { data, error } = await supabase
    .from("org_invites")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to cancel invite");
  }

  if (!data) {
    throw new NotFoundError("Pending invite not found");
  }
}

export async function resendInvite(
  db: SupabaseClient,
  orgId: string,
  inviteId: string,
): Promise<void> {
  const supabase = db;

  const newExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("org_invites")
    .update({
      expires_at: newExpiry,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId)
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to resend invite");
  }

  if (!data) {
    throw new NotFoundError("Pending invite not found");
  }
}
