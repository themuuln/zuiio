import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Logout route — clears the identity-project session.
 *
 * Accepts a `next` query parameter for allowlisted product return URLs.
 * Only relative paths or exact origin matches are followed.
 */
export default async function LogoutPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Only follow allowlisted relative redirects
  const next = params.next;
  if (next && next.startsWith("/") && !next.includes("://")) {
    redirect(next);
  }

  redirect("/login");
}
