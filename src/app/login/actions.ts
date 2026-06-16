"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim()) {
    return { error: "И-мэйл хаяг шаардлагатай." };
  }

  if (typeof password !== "string" || !password) {
    return { error: "Нууц үг шаардлагатай." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      error: "И-мэйл эсвэл нууц үг буруу байна.",
    };
  }

  // Get the redirect path from query params or default to dashboard
  const nextUrl = formData.get("next");
  const redirectTo = typeof nextUrl === "string" && nextUrl ? nextUrl : "/";

  redirect(redirectTo);
}
