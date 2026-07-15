import "server-only";
import { getDb } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
}

/**
 * Admin gate. Memory backend (local dev, no credentials) is open;
 * Supabase backend requires a session + admin_users membership.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const db = getDb();
  if (db.backend === "memory") {
    return { userId: "dev-admin" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (await db.isAdmin(user.id)) ? { userId: user.id } : null;
}

/** For server actions — throws instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
