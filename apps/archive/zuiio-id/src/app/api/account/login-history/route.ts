import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * GET /api/account/login-history
 * Returns the current user's recent login attempts (last 20).
 * Only returns attempts for the user's email.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ attempts: [] });
  }

  const admin = await createAdminClient();

  const { data } = await admin
    .from("login_attempts")
    .select("id, identifier, success, ip_address, attempted_at")
    .eq("identifier", user.email.toLowerCase())
    .order("attempted_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ attempts: data ?? [] });
}
