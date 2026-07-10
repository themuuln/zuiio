"use server";

import { validateTurnstile } from "@zuiio/supabase";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { customerLoginSchema } from "@/lib/validation/auth-schemas";

type CustomerLoginState = ActionState<{ email: string }>;

export async function customerLogin(
  _prevState: CustomerLoginState,
  formData: FormData,
): Promise<CustomerLoginState> {
  const raw = {
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
  };
  const redirectTo = (formData.get("redirectTo") as string) || "/portal";
  const turnstileToken = formData.get("turnstileToken") as string | null;
  const turnstile = await validateTurnstile(turnstileToken);
  if (!turnstile.success) {
    return { formError: turnstile.error };
  }

  const parsed = customerLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { email: raw.email },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      values: { email: parsed.data.email },
      formError: error.message,
    };
  }

  redirect(redirectTo);
}
