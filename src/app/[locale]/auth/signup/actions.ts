"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface SignupState {
  error?: string;
}

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

  redirect("/auth/login");
}
