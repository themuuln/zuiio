"use server";

import { createClient } from "@/lib/supabase/server";

export interface ForgotPasswordState {
  formError?: string;
  success?: boolean;
}

export async function forgotPassword(
  _previous: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { formError: "Зөв имэйл хаяг оруулна уу." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Supabase returns success even if the email doesn't exist (no account enumeration)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { formError: "Имэйл илгээхэд алдаа гарлаа." };
  }

  return { success: true };
}
