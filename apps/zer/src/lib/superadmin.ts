import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

/**
 * Checks if the currently authenticated user is the superadmin
 * (the developer). Returns the user's email on success, null otherwise.
 */
export async function getSuperadminEmail(): Promise<string | null> {
  if (!SUPERADMIN_EMAIL) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  return user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    ? user.email
    : null;
}

/**
 * Guards a page/section — redirects to /login if not superadmin.
 * Returns the superadmin email on success.
 */
export async function requireSuperadmin(): Promise<string> {
  const email = await getSuperadminEmail();
  if (!email) redirect("/login");
  return email;
}
