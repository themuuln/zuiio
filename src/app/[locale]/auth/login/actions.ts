"use server";

import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { loginSchema } from "@/lib/validation/auth-schemas";

type LoginState = ActionState<{ username: string }> & {
  redirectTo?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    username: (formData.get("username") as string) || "",
    password: (formData.get("password") as string) || "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { username: raw.username },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const serviceRole = await createServiceRoleClient();

  // Look up the user by username
  const { data: profile } = await serviceRole
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (!profile) {
    return {
      values: { username: raw.username },
      formError: "No account found with this username",
    };
  }

  // Get the user's email from auth.users via service role
  const { data: authUser } = await serviceRole.auth.admin.getUserById(
    profile.id,
  );
  if (!authUser?.user?.email) {
    return {
      values: { username: raw.username },
      formError: "No account found with this username",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      values: { username: raw.username },
      formError: error.message,
    };
  }

  const redirectTo = formData.get("redirectTo") as string | null;
  const params = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";
  return { redirectTo: `/auth/select-organization${params}` };
}
