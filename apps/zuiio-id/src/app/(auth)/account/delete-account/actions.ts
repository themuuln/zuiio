"use server";

import { redirect } from "next/navigation";
import { auditEvent } from "@/lib/supabase/audit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface DeleteAccountState {
  formError?: string;
  success?: boolean;
}

/**
 * Server Action: delete user account (GDPR compliance).
 * Requires password confirmation. Deletes all user data.
 */
export async function deleteAccount(
  _previous: DeleteAccountState | undefined,
  formData: FormData,
): Promise<DeleteAccountState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { formError: "Нууц үгээ оруулна уу." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { formError: "Хэрэглэгч олдсонгүй." };
  }

  // Verify password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (verifyError) {
    return { formError: "Нууц үг буруу байна." };
  }

  const admin = await createAdminClient();

  // Audit the deletion before proceeding
  await auditEvent({
    eventType: "session_revoked",
    userId: user.id,
    metadata: { action: "account_deletion_requested" },
  });

  // Delete user via Supabase Admin API
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { formError: "Бүртгэл устгахад алдаа гарлаа." };
  }

  // Sign out
  await supabase.auth.signOut();

  redirect("/login");
}
