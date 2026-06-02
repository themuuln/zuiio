"use server";

import type { ActionState } from "@/lib/form-validation";
import {
  flattenFieldErrors,
  normalizeMongolianPhone,
} from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { loginSchema } from "@/lib/validation/auth-schemas";

type LoginState = ActionState<{ identifier: string }> & {
  redirectTo?: string;
};

type IdentifierType = "email" | "phone" | "username";

function detectIdentifierType(value: string): IdentifierType {
  if (value.includes("@")) return "email";
  // Check if it looks like a phone number (starts with + or is mostly digits)
  const digits = value.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) return "phone";
  return "username";
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    identifier: (formData.get("identifier") as string)?.trim() || "",
    password: (formData.get("password") as string) || "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { identifier: raw.identifier },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const serviceRole = await createServiceRoleClient();

  const { identifier, password } = parsed.data;
  const type = detectIdentifierType(identifier);

  if (type === "email") {
    // Sign in directly with email — Supabase Auth handles it natively
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });

    if (error) {
      return {
        values: { identifier: raw.identifier },
        formError: error.message,
      };
    }

    const redirectTo = formData.get("redirectTo") as string | null;
    const params = redirectTo
      ? `?redirectTo=${encodeURIComponent(redirectTo)}`
      : "";
    return { redirectTo: `/auth/select-organization${params}` };
  }

  // For phone or username: look up the profile, get the auth email, then sign in
  let lookupColumn: "username" | "phone";
  let lookupValue: string;

  if (type === "phone") {
    lookupColumn = "phone";
    lookupValue = normalizeMongolianPhone(identifier.trim());
  } else {
    lookupColumn = "username";
    lookupValue = identifier.trim().toLowerCase();
  }

  const { data: profile, error: profileError } = await serviceRole
    .from("profiles")
    .select("id")
    .eq(lookupColumn, lookupValue)
    .maybeSingle();

  if (profileError) {
    console.error("Login lookup database error:", profileError);
    return {
      values: { identifier: raw.identifier },
      formError: `Database lookup error: ${profileError.message}`,
    };
  }

  if (!profile) {
    return {
      values: { identifier: raw.identifier },
      formError:
        type === "phone"
          ? "No account found with this phone number"
          : "No account found with this username",
    };
  }

  // Get the user's email from auth.users via service role
  const { data: authUser, error: authUserError } =
    await serviceRole.auth.admin.getUserById(profile.id);
  if (authUserError) {
    console.error("Login auth user fetch error:", authUserError);
    return {
      values: { identifier: raw.identifier },
      formError: `Auth lookup error: ${authUserError.message}`,
    };
  }

  if (!authUser?.user?.email) {
    return {
      values: { identifier: raw.identifier },
      formError:
        type === "phone"
          ? "No account found with this phone number"
          : "No account found with this username",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  });

  if (error) {
    return {
      values: { identifier: raw.identifier },
      formError: error.message,
    };
  }

  const redirectTo = formData.get("redirectTo") as string | null;
  const params = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";
  return { redirectTo: `/auth/select-organization${params}` };
}
