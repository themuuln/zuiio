import type { SupabaseClient, User } from "@supabase/supabase-js";

export class AuthRequiredError extends Error {
  constructor() {
    super("Нэвтрэх шаардлагатай");
    this.name = "AuthRequiredError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Хандах эрх байхгүй") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Get the current user or throw AuthRequiredError. */
export async function withAuth(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new AuthRequiredError();
  return user;
}

/** Get current session or null — non-throwing. */
export async function getSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** Get user ID or null without throwing. */
export async function getUserId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Check if the current user belongs to an org.
 * Assumes a table named `org_members` with columns `org_id`, `user_id`, `role`.
 * Pass your own table/column names via options if your schema differs.
 */
export async function getOrgRole(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  opts?: {
    table?: string;
    orgCol?: string;
    userCol?: string;
    roleCol?: string;
  },
): Promise<string | null> {
  const table = opts?.table ?? "org_members";
  const orgCol = opts?.orgCol ?? "org_id";
  const userCol = opts?.userCol ?? "user_id";
  const roleCol = opts?.roleCol ?? "role";

  const { data } = await supabase
    .from(table)
    .select(roleCol)
    .eq(orgCol, orgId)
    .eq(userCol, userId)
    .single();

  return (data as Record<string, string> | null)?.[roleCol] ?? null;
}

/** Require org membership — throws ForbiddenError if not a member. */
export async function requireOrgMember(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  opts?: Parameters<typeof getOrgRole>[3],
): Promise<string> {
  const role = await getOrgRole(supabase, orgId, userId, opts);
  if (!role) throw new ForbiddenError();
  return role;
}
