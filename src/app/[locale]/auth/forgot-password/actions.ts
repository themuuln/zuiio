"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/auth-schemas";
import {
  flattenFieldErrors,
  forgotPasswordSchema,
} from "@/lib/validation/auth-schemas";

type ForgotPasswordState = ActionState<{ email: string }> & {
  success?: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = {
    email: (formData.get("email") as string) || "",
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { email: raw.email },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/reset-password`,
    },
  );

  if (error) {
    return {
      values: { email: parsed.data.email },
      formError: error.message,
    };
  }

  return { success: true };
}
