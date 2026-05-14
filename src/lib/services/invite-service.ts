import crypto from "node:crypto";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { OrgInvite } from "@/lib/database.types";
import type { InviteUserParams } from "@/lib/types";

function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function createInvite(
  orgId: string,
  params: InviteUserParams,
  invitedByUserId: string,
): Promise<OrgInvite> {
  const { email, roleId, message } = params;

  if (!email?.trim()) {
    throw new ValidationError("Email is required");
  }

  const supabase = await createClient();

  const existing = await supabase
    .from("org_invites")
    .select("id, status")
    .eq("organization_id", orgId)
    .eq("email", email.toLowerCase().trim())
    .neq("status", "accepted")
    .maybeSingle();

  if (existing?.data) {
    throw new ConflictError(
      "An active invite already exists for this email",
    );
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
      expires_at: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invite");
  }

  return data;
}

export async function getOrgInvites(orgId: string): Promise<OrgInvite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("org_invites")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch invites");
  }

  return data ?? [];
}

export async function getInviteByToken(
  token: string,
): Promise<
  OrgInvite & { organization_name: string; inviter_name: string | null }
> {
  const supabase = await createClient();

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
  token: string,
  userId: string,
): Promise<{ organizationId: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_invite", {
    invite_token: token,
    accepting_user_id: userId,
  });

  if (error) {
    throw new ValidationError(error.message ?? "Failed to accept invite");
  }

  const result = data as { success: boolean; error?: string; organization_id?: string };

  if (!result.success) {
    throw new ValidationError(result.error ?? "Failed to accept invite");
  }

  if (!result.organization_id) {
    throw new ValidationError("No organization ID returned from invitation");
  }

  return { organizationId: result.organization_id };
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("org_invites")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error) {
    throw new Error(error.message ?? "Failed to cancel invite");
  }
}

export async function resendInvite(inviteId: string): Promise<void> {
  const supabase = await createClient();

  const newExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("org_invites")
    .update({
      expires_at: newExpiry,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message ?? "Failed to resend invite");
  }
}
