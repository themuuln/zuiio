"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Logout Server Action.
 *
 * Signs the current user out of Supabase and redirects to the allowlisted
 * `next` parameter, or `/login` if absent. Only relative paths that start
 * with `/` and don't contain `://` are followed — no open redirects.
 * Absolute typed routes (`/login`, `/`) are the preferred targets.
 */
export async function logout(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const next = formData.get("next") as string | null;
  if (next && next.startsWith("/") && !next.includes("://")) {
    redirect(next as Route);
  }

  redirect("/login" as Route);
}
