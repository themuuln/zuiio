"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/form-validation";
import {
  flattenFieldErrors,
  normalizeMongolianPhone,
} from "@/lib/form-validation";
import { finalizeSignup } from "@/lib/services/signup-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { signupSchema } from "@/lib/validation/auth-schemas";

type SignupState = ActionState<{
  organizationName: string;
  fullName: string;
  identifier: string;
}> & {
  redirectTo?: string;
};

type IdentifierType = "email" | "phone" | "username";

function detectIdentifierType(value: string): IdentifierType {
  if (value.includes("@") && !value.endsWith("@tolom.auth")) return "email";
  const digits = value.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) return "phone";
  return "username";
}

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const raw = {
    organizationName: (formData.get("organizationName") as string) || "",
    fullName: (formData.get("fullName") as string) || "",
    identifier: (formData.get("identifier") as string) || "",
    password: (formData.get("password") as string) || "",
    confirmPassword: (formData.get("confirmPassword") as string) || "",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: {
        organizationName: raw.organizationName,
        fullName: raw.fullName,
        identifier: raw.identifier,
      },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  // Validate password match (handled by .refine in schema, but safeParse covers it)
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      values: {
        organizationName: raw.organizationName,
        fullName: raw.fullName,
        identifier: raw.identifier,
      },
      fieldErrors: { confirmPassword: "Passwords do not match" },
    };
  }

  const { identifier, password, fullName, organizationName } = parsed.data;
  const type = detectIdentifierType(identifier);
  const serviceRole = await createServiceRoleClient();

  // Determine the auth email and profile fields based on identifier type
  let authEmail: string;
  let usernameValue: string | undefined;
  let phoneValue: string | undefined;

  if (type === "email") {
    authEmail = identifier;
  } else if (type === "phone") {
    phoneValue = normalizeMongolianPhone(identifier);
    authEmail = `phone_${phoneValue.replace(/[^0-9]/g, "")}@tolom.auth`;
  } else {
    // type === "username"
    usernameValue = identifier;
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
      return {
        values: {
          organizationName: raw.organizationName,
          fullName: raw.fullName,
          identifier: raw.identifier,
        },
        fieldErrors: {
          identifier:
            "Username can only contain letters, numbers, and underscores",
        },
      };
    }
    if (usernameValue.length < 3 || usernameValue.length > 30) {
      return {
        values: {
          organizationName: raw.organizationName,
          fullName: raw.fullName,
          identifier: raw.identifier,
        },
        fieldErrors: {
          identifier: "Username must be between 3 and 30 characters",
        },
      };
    }
    authEmail = `username_${usernameValue.toLowerCase()}@tolom.auth`;
  }

  try {
    // Use service-role to create user with email_confirm: true
    const { data, error } = await serviceRole.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        org_name: organizationName,
      },
    });

    if (error) {
      const formError = error.message.includes("already registered")
        ? "This email, phone, or username is already in use"
        : error.message;
      return {
        values: {
          organizationName: raw.organizationName,
          fullName: raw.fullName,
          identifier: raw.identifier,
        },
        formError,
      };
    }

    // Save profile data
    if (data.user) {
      const profileData: Record<string, string> = {
        id: data.user.id,
        full_name: fullName,
      };
      if (usernameValue) profileData.username = usernameValue;
      if (phoneValue) profileData.phone = phoneValue;

      await serviceRole.from("profiles").upsert(profileData, {
        onConflict: "id",
      });
    }

    // Sign in with the server client to get a session cookie
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (signInError) {
      redirect("/auth/login");
    }

    // Finalize org setup
    try {
      await finalizeSignup(supabase, {
        orgName: organizationName,
      });
    } catch (finalizeError) {
      console.error("Eager finalizeSignup failed:", finalizeError);
    }

    redirect("/auth/select-organization");
  } catch (error) {
    if (isSupabaseNetworkError(error)) {
      console.error("Supabase signUp network failure", error);
      return {
        values: {
          organizationName: raw.organizationName,
          fullName: raw.fullName,
          identifier: raw.identifier,
        },
        formError: "Network error. Please check your connection and try again.",
      };
    }
    throw error;
  }
}

function isSupabaseNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = "cause" in error ? error.cause : undefined;
  if (cause instanceof Error && cause.message.includes("Connect Timeout Error"))
    return true;
  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    cause.code === "UND_ERR_CONNECT_TIMEOUT"
  )
    return true;
  return error.message === "fetch failed";
}
