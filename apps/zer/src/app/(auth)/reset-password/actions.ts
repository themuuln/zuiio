"use server";

import { capture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import { validatePasswordUpdateInput } from "@/lib/domain-rules";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@zuiio/core";

export async function updatePassword(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  const validationError = validatePasswordUpdateInput({
    password,
    confirmPassword,
  });
  if (validationError) {
    return { error: validationError };
  }
  const rl = rateLimit(`reset-password`, 10, 300_000);
  if (rl.error) return { error: rl.error };


  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    capture(error, { context: "updatePassword: reset password" });
    return { error: error.message };
  }

  redirect("/");
}
