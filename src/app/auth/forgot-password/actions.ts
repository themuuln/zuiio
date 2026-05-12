"use server";

import { createClient } from "@/lib/supabase/server";

interface ForgotPasswordState {
  error?: string;
  success?: boolean;
}

export async function resetPasswordForEmail(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${siteUrl}/auth/reset-password`,
    },
  );

  if (error) return { error: error.message };

  return { success: true };
}
