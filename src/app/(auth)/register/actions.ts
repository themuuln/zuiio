"use server";

import { redirect } from "next/navigation";
import { validateRegistrationInput } from "@/lib/domain-rules";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation";

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const fullName = getString(formData, "full_name");

  const validationError = validateRegistrationInput({
    fullName,
    email,
    password,
  });
  if (validationError) {
    return { error: validationError };
  }

  const { url } = getSupabaseEnv();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${url}/auth/callback?next=/organization/new`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/organization/new");
  }

  return {
    success:
      "Бүртгэл үүслээ. Имэйлээ шалгаад баталгаажуулсны дараа байгууллагаа үүсгэнэ үү.",
  };
}
