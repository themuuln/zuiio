"use server";

import { createClient } from "@/lib/supabase/server";

interface LoginState {
  error?: string;
  redirectTo?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };

  const redirectTo = formData.get("redirectTo") as string | null;
  const params = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";
  return { redirectTo: `/auth/select-organization${params}` };
}
