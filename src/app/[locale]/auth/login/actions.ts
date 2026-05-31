"use server";

import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isPhone, loginSchema } from "@/lib/validation/auth-schemas";

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
  let loginEmail = parsed.data.email;

  // If the identifier is a phone number, look up the user's email from profiles
  if (isPhone(loginEmail)) {
    const serviceRole = await createServiceRoleClient();
    const { data: profile } = await serviceRole
      .from("profiles")
      .select("id")
      .eq("phone", loginEmail)
      .maybeSingle();

    if (!profile) {
      return {
        values: { email: raw.email },
        formError: "No account found with this phone number",
      };
    }

    // Get the user's email from auth.users via service role
    const { data: authUser } = await serviceRole.auth.admin.getUserById(
      profile.id,
    );
    if (!authUser?.user?.email) {
      return {
        values: { email: raw.email },
        formError: "No account found with this phone number",
      };
    }
    loginEmail = authUser.user.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: parsed.data.password,
  });

  if (error) {
    return {
      values: { email: raw.email },
      formError: error.message,
    };
  }

  const redirectTo = formData.get("redirectTo") as string | null;
  const params = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";
  return { redirectTo: `/auth/select-organization${params}` };
}
