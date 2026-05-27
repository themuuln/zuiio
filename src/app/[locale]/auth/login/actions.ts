"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/auth-schemas";
import { flattenFieldErrors, loginSchema } from "@/lib/validation/auth-schemas";

type LoginState = ActionState<{ email: string }> & {
  redirectTo?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { email: raw.email },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      values: { email: parsed.data.email },
      formError: error.message,
    };
  }

  const redirectTo = formData.get("redirectTo") as string | null;
  const params = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";
  return { redirectTo: `/auth/select-organization${params}` };
}
