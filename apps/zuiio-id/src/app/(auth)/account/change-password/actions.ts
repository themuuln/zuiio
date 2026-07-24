"use server";

import { validatePassword } from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/server";

export interface ChangePasswordState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

/**
 * Server Action: change password (requires current password).
 * Unlike reset-password (which uses a email link), this is for
 * authenticated users changing their password from the account page.
 */
export async function changePassword(
  _previous: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string[]> = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = ["Одоогийн нууц үгээ оруулна уу."];
  }

  const passwordResult = validatePassword(newPassword);
  if (!passwordResult.valid) {
    fieldErrors.newPassword = passwordResult.errors;
  }

  if (newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = ["Нууц үг таарахгүй байна."];
  }

  if (newPassword === currentPassword) {
    fieldErrors.newPassword = ["Шинэ нууц үг одоогийн нууц үгтэй адил байна."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { formError: "Хэрэглэгч олдсонгүй." };
  }

  // Verify current password by attempting sign-in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { formError: "Одоогийн нууц үг буруу байна." };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { formError: "Нууц үг шинэчлэхэд алдаа гарлаа." };
  }

  return { success: true };
}
