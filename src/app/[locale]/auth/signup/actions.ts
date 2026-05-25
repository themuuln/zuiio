"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface SignupState {
  error?: string;
}

const SUPABASE_NETWORK_ERROR =
  "We couldn't reach the authentication service. Please try again in a moment.";

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const { error } = await supabase.auth.signUp({
      email: formData.get("email") as string,
      password,
      options: {
        data: {
          full_name: formData.get("fullName") as string,
          org_name: formData.get("organizationName") as string,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) return { error: error.message };
  } catch (error) {
    if (isSupabaseNetworkError(error)) {
      console.error("Supabase signUp network failure", error);
      return { error: SUPABASE_NETWORK_ERROR };
    }

    throw error;
  }

  redirect("/auth/login");
}

function isSupabaseNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = "cause" in error ? error.cause : undefined;

  if (
    cause instanceof Error &&
    cause.message.includes("Connect Timeout Error")
  ) {
    return true;
  }

  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    cause.code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return true;
  }

  return error.message === "fetch failed";
}
