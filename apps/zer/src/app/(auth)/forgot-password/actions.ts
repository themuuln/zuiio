"use server";

import { validatePasswordResetRequestInput } from "@/lib/domain-rules";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation";

export async function requestPasswordReset(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const email = getString(formData, "email");

  const validationError = validatePasswordResetRequestInput({ email });
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Нууц үг сэргээх холбоосыг таны имэйл рүү илгээлээ.",
  };
}
