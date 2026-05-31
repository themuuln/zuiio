"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { finalizeSignup } from "@/lib/services/signup-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { signupSchema } from "@/lib/validation/auth-schemas";

type SignupState = ActionState<{
  organizationName: string;
  fullName: string;
  username: string;
}> & {
  redirectTo?: string;
};

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const raw = {
    organizationName: (formData.get("organizationName") as string) || "",
    fullName: (formData.get("fullName") as string) || "",
    username: (formData.get("username") as string) || "",
    password: (formData.get("password") as string) || "",
    confirmPassword: (formData.get("confirmPassword") as string) || "",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: {
        organizationName: raw.organizationName,
        fullName: raw.fullName,
        username: raw.username,
      },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const serviceRole = await createServiceRoleClient();

  // Generate a placeholder email for Supabase Auth (username-based accounts)
  const authEmail = `username_${parsed.data.username.toLowerCase()}@tolom.auth`;

  try {
    // Use service-role to create user with email_confirm: true (no confirmation email)
    const { data, error } = await serviceRole.auth.admin.createUser({
      email: authEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        org_name: parsed.data.organizationName,
      },
    });

    if (error) {
      const formError = error.message.includes("already registered")
        ? "This username is already taken"
        : error.message;
      return {
        values: {
          organizationName: raw.organizationName,
          fullName: raw.fullName,
          username: raw.username,
        },
        formError,
      };
    }

    // Save username to profiles table
    if (data.user) {
      await serviceRole.from("profiles").upsert(
        {
          id: data.user.id,
          username: parsed.data.username,
          full_name: parsed.data.fullName,
        },
        { onConflict: "id" },
      );
    }

    // Sign in with the server client to get a session cookie
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: parsed.data.password,
    });

    if (signInError) {
      // Fallback: redirect to login
      redirect("/auth/login");
    }

    // Finalize org setup
    try {
      await finalizeSignup(supabase, {
        orgName: parsed.data.organizationName,
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
          username: raw.username,
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
