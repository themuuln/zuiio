"use server";

import {
  checkPasswordResetRateLimit,
  recordLoginAttempt,
} from "@/lib/rate-limit";
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

  if (!email?.includes("@")) {
    return { formError: "Зөв имэйл хаяг оруулна уу." };
  }
  // Rate limit password reset emails (3 per 15 min)
  const rateLimit = await checkPasswordResetRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      formError: `Хэт их оролдлогын тоо. Түр хүлээнэ үү. ${rateLimit.retryAfterSeconds} секундийн дараа дахин оролдоно уу.`,
    };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Supabase returns success even if the email doesn't exist (no account enumeration)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Record the email send attempt (fire-and-forget, regardless of success)
  void recordLoginAttempt(email, true);
  if (error) {
    return { formError: "Имэйл илгээхэд алдаа гарлаа." };
  }

  return { success: true };
}
