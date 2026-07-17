"use server";

import { redirect } from "next/navigation";
import { auditEvent } from "@/lib/supabase/audit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface ProfileUpdateState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

export async function updateProfile(
  _previous: ProfileUpdateState | undefined,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};

  if (!fullName || fullName.length > 80) {
    fieldErrors.fullName = ["Нэр 1-80 тэмдэгт байх ёстой."];
  }

  if (username.length < 3 || username.length > 32) {
    fieldErrors.username = ["Нэр 3-32 тэмдэгт байх ёстой."];
  } else if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) {
    fieldErrors.username = [
      "Нэр латин үсэг, тоо, . _ - тэмдэгтээс бүрдэх ёстой.",
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { formError: "Энэ нэр аль хэдийн ашиглагдаж байна." };
    }
    return { formError: "Шинэчлэхэд алдаа гарлаа." };
  }

  return { success: true };
}

// ─── Session management ───────────────────────────────────────────

export interface SessionInfo {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip_address: string | null;
  aal: string | null;
  is_current: boolean;
}

export interface GrantInfo {
  id: string;
  client_id: string;
  client_name: string;
  scopes: string;
  created_at: string;
}

export interface SessionState {
  sessions?: SessionInfo[];
  grants?: GrantInfo[];
  error?: string;
  revokeSuccess?: boolean;
  revokeGrantSuccess?: boolean;
}

/** Fetch active sessions for the current user. */
export async function getSessions(): Promise<SessionInfo[]> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  // Get current session ID from JWT
  const currentSessionId = session.user.app_metadata?.session_id ?? "";

  const admin = await createAdminClient();

  // Query auth.sessions via admin client
  const { data: sessions } = await admin
    .schema("auth")
    .from("sessions")
    .select("id, created_at, updated_at, user_agent, ip_address, aal")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (!sessions) return [];

  return sessions.map((s) => ({
    id: s.id,
    created_at: s.created_at,
    updated_at: s.updated_at,
    user_agent: s.user_agent ?? null,
    ip_address: s.ip_address ?? null,
    aal: s.aal ?? null,
    is_current: s.id === currentSessionId,
  }));
}

/** Revoke a non-current session by deleting it. */
export async function revokeSession(
  sessionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "Нэвтрээгүй байна." };

  const currentSessionId = session.user.app_metadata?.session_id ?? "";
  if (sessionId === currentSessionId) {
    return { error: "Идэвхитай суултыг устгах боломжгүй." };
  }

  const admin = await createAdminClient();

  const { error } = await admin
    .schema("auth")
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", session.user.id);

  if (error) {
    return { error: "Суултыг устгахад алдаа гарлаа." };
  }

  await auditEvent({
    eventType: "session_revoked",
    userId: session.user.id,
    clientId: sessionId,
  });

  return {};
}

/** Fetch connected OAuth grants (products the user has authorized). */
export async function getGrants(): Promise<GrantInfo[]> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const { data, error } = await supabase.auth.oauth.listGrants();

  if (error || !data) return [];

  // data is an array of grants — each has id, client, scopes, created_at
  return (data as Array<Record<string, unknown>>).map((g) => ({
    id: String(g.id ?? ""),
    client_id: String(g.client_id ?? ""),
    client_name:
      (g.client as Record<string, unknown>)?.name?.toString() ??
      "Тодорхойлогдоогүй",
    scopes: String(g.scopes ?? ""),
    created_at: String(g.created_at ?? ""),
  }));
}

/** Revoke an OAuth grant (connected product). */
export async function revokeGrantAction(
  clientId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "Нэвтрээгүй байна." };

  const { error } = await supabase.auth.oauth.revokeGrant({ clientId });

  if (error) {
    return { error: "Холболтыг устгахад алдаа гарлаа." };
  }

  await auditEvent({
    eventType: "grant_revoked",
    userId: session.user.id,
    clientId,
  });

  return {};
}
