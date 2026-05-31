"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth-schemas";

type ResetPasswordState = ActionState;

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const raw = {
    password: (formData.get("password") as string) || "",
    confirmPassword: (formData.get("confirmPassword") as string) || "",
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { formError: error.message };
  }

  redirect("/auth/login?reset=success");
}
