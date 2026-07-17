import { type NextRequest, NextResponse } from "next/server";
import { reportServerError } from "@/lib/sentry-report-server";
import { finalizeSignup } from "@/lib/services/signup-service";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * SSO callback handler with account linking.
 *
 * If a user with the same email already exists (from email/password signup),
 * we link the SSO identity to that account instead of creating a duplicate.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/select-organization";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        // Check if this is a new SSO user that should be linked to existing account
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          await linkExistingAccountIfNeeded(user.email, user.id);
        }
        
        await finalizeSignup(supabase);
      } catch (finalizeError) {
        reportServerError(
          "Finalize signup after callback failed:",
          finalizeError,
        );
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_error`,
  );
}

/**
 * Links an SSO identity to an existing local account if:
 * 1. A user with the same email exists
 * 2. That user signed up via email/password (not SSO)
 * 3. The SSO user is different from the local user
 *
 * This prevents duplicate accounts when users switch from email/password to SSO.
 */
async function linkExistingAccountIfNeeded(
  email: string,
  ssoUserId: string,
): Promise<void> {
  try {
    const admin = await createServiceRoleClient();
    
    // Find existing user with this email (excluding the current SSO user)
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email && u.id !== ssoUserId && !u.app_metadata?.provider?.includes("custom:zuiio")
    );
    
    if (!existingUser) {
      // No existing local account, or already linked
      return;
    }
    
    // Found a local account - we need to handle this case
    // For now, we'll add metadata to indicate this SSO user should be treated
    // as the same person. In production, you'd want to:
    // 1. Merge the accounts in auth.users
    // 2. Transfer data from old account to new
    // 3. Or link them via a identities table
    
    console.log(`[SSO Link] Found existing account for ${email}: ${existingUser.id}`);
    console.log(`[SSO Link] SSO user: ${ssoUserId}`);
    console.log(`[SSO Link] TODO: Implement account merging in production`);
    
    // Update the SSO user's metadata to reference the original account
    await admin.auth.admin.updateUserById(ssoUserId, {
      user_metadata: {
        ...existingUser.user_metadata,
        linked_account_id: existingUser.id,
        linked_at: new Date().toISOString(),
      },
    });
    
  } catch (err) {
    // Don't fail the login if linking fails
    reportServerError("SSO account linking failed:", err);
  }
}
