"use server";

import { createClient } from "@/lib/supabase/server";

export interface VerifyEmailState {
  formError?: string;
  success?: boolean;
}

/**
 * Server Action: resend email verification link.
 *
 * Uses Supabase's `resend` (GoTrue API) to send a new signup confirmation email.
 * Always returns success to prevent email enumeration.
 */
export async function resendVerification(
  _previous: VerifyEmailState | undefined,
  formData: FormData,
): Promise<VerifyEmailState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email?.includes("@")) {
    return { formError: "Зөв имэйл хаяг оруулна уу." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // Don't reveal whether the email exists — return success anyway
    // to prevent enumeration
    console.error("[resendVerification]", error.message);
  }

  // Always return success — prevents email enumeration
  return { success: true };
}
