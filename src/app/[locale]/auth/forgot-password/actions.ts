"use server";

import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { forgotPasswordSchema } from "@/lib/validation/auth-schemas";

type ForgotPasswordState = ActionState<{ username: string }> & {
  success?: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = {
    username: (formData.get("username") as string) || "",
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { username: raw.username },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Look up the user by username to get their auth email
  const serviceRole = await createServiceRoleClient();
  const { data: profile } = await serviceRole
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (profile) {
    const { data: authUser } = await serviceRole.auth.admin.getUserById(
      profile.id,
    );
    if (authUser?.user?.email) {
      // Don't await — fire and forget to avoid revealing user existence timing
      supabase.auth.resetPasswordForEmail(authUser.user.email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      });
    }
  }

  // Always return success — don't reveal whether the username exists
  return { success: true };
}
