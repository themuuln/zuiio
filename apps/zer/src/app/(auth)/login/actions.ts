"use server";

import { redirect } from "next/navigation";
import { validateLoginInput } from "@/lib/domain-rules";
import { createClient } from "@/lib/supabase/server";
import { getString, sanitizeRedirectPath } from "@/lib/validation";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const validationError = validateLoginInput({ email, password });
  if (validationError) {
    return { error: validationError };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const next = getString(formData, "next");
  redirect(sanitizeRedirectPath(next));
}
