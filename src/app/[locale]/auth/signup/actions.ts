"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/auth-schemas";
import {
  flattenFieldErrors,
  signupSchema,
} from "@/lib/validation/auth-schemas";

type SignupState = ActionState<{
  organizationName: string;
  fullName: string;
  email: string;
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
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
    confirmPassword: (formData.get("confirmPassword") as string) || "",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: {
        organizationName: raw.organizationName,
        fullName: raw.fullName,
        email: raw.email,
      },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          org_name: parsed.data.organizationName,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      const formError = error.message.includes("already registered")
        ? "This email is already registered"
        : error.message;
      return {
        values: {
          organizationName: parsed.data.organizationName,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
        },
        formError,
      };
    }
  } catch (error) {
    if (isSupabaseNetworkError(error)) {
      console.error("Supabase signUp network failure", error);
      return {
        values: {
          organizationName: parsed.data.organizationName,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
        },
        formError: "Network error. Please check your connection and try again.",
      };
    }
    throw error;
  }

  redirect("/auth/login");
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
