"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignupState {
  error?: string;
}

export async function signup(
  _prevState: SignupState | null,
  formData: FormData,
): Promise<SignupState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const organizationName = formData.get("organizationName") as string;

  if (!email || !password || !fullName || !organizationName) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/confirm-email");
}
