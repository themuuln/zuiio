"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { ActionState } from "@/lib/validation/auth-schemas";
import {
  customerSetPasswordSchema,
  flattenFieldErrors,
} from "@/lib/validation/auth-schemas";

type SetPasswordState = ActionState<{ email: string }> & {
  success?: boolean;
};

export async function setCustomerPassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = (formData.get("token") as string) || "";

  if (!token) {
    return {
      formError:
        "No access token provided. Please use the link from your email or SMS.",
    };
  }

  const raw = {
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
    confirmPassword: (formData.get("confirmPassword") as string) || "",
  };

  const parsed = customerSetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { email: raw.email },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, organization_id, first_name, last_name, email, portal_token")
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (customerError) return { formError: customerError.message };
  if (!customer) return { formError: "Invalid or expired token" };

  const serviceRole = await createServiceRoleClient();

  const { data: existingUsers, error: lookupError } =
    await serviceRole.auth.admin.listUsers();

  if (lookupError) return { formError: lookupError.message };

  const emailConflict = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase(),
  );

  if (emailConflict) {
    const { data: linkedCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("customer_user_id", emailConflict.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkedCustomer && linkedCustomer.id !== customer.id) {
      return {
        values: { email: parsed.data.email },
        formError: "Email is already linked to another account",
      };
    }
  }

  const { data: newUser, error: createError } =
    await serviceRole.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });

  if (createError) {
    return {
      values: { email: parsed.data.email },
      formError: createError.message,
    };
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({ customer_user_id: newUser.user.id })
    .eq("id", customer.id);

  if (updateError) {
    return { formError: updateError.message };
  }

  redirect("/portal");
}
