"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface CustomerLoginState {
  error?: string;
}

export async function customerLogin(
  _prevState: CustomerLoginState,
  formData: FormData,
): Promise<CustomerLoginState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/portal";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  redirect(redirectTo);
}
