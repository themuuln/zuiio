"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { error: "Нууц үг шаардлагатай." };
  }

  if (password.length < 8) {
    return { error: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: `Нууц үг солиход алдаа гарлаа: ${error.message}` };
  }

  return { success: true };
}
