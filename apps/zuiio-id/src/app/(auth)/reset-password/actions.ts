"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResetPasswordState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

export async function resetPassword(
  _previous: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string[]> = {};

  if (password.length < 8) {
    fieldErrors.password = ["Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой."];
  }

  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = ["Нууц үг таарахгүй байна."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { formError: "Нууц үг шинэчлэхэд алдаа гарлаа." };
  }

  return { success: true };
}
