"use server";

import { createClient } from "@/lib/supabase/server";

export async function forgotPassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { error: "И-мэйл хаяг шаардлагатай." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteUrl}/update-password`,
  });

  if (error) {
    return { error: "И-мэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу." };
  }

  return { success: true };
}
