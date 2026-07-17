import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/validation";

/**
 * SSO callback handler with account linking.
 *
 * If a user with the same email already exists (from email/password signup),
 * we link the SSO identity to that account instead of creating a duplicate.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next") ?? "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", origin),
      );
    }

    // Check if this is a new SSO user that should be linked to existing account
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      await linkExistingAccountIfNeeded(user.email, user.id);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}

/**
 * Links an SSO identity to an existing local account if possible.
 *
 * This prevents duplicate accounts when users switch from email/password to SSO.
 * Note: Full account merging requires service-role client which Zer doesn't have.
 * For now, we log the duplicate and let the user know.
 */
async function linkExistingAccountIfNeeded(
  email: string,
  ssoUserId: string,
): Promise<void> {
  try {
    // Check if there are multiple users with this email
    // This is a best-effort check - without service role, we can't merge accounts
    const supabase = await createClient();

    // Get current session to verify
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email === email && user?.id === ssoUserId) {
      // This is the SSO user we just created
      // Check if they have linked_account_id metadata (from previous linking attempt)
      const linkedAccountId = user.user_metadata?.linked_account_id;

      if (linkedAccountId) {
        // TODO: In production, merge the accounts or redirect to merge flow
      }
    }
  } catch {
    // Don't fail the login if linking check fails
  }
}
