"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ValidationError, ConflictError } from "@/lib/errors";

interface SetPasswordState {
  error?: string;
  success?: boolean;
}

export async function setCustomerPassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !email || !password) {
    return { error: "token, email, and password are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, organization_id, first_name, last_name, email, portal_token")
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (customerError) return { error: customerError.message };
  if (!customer) return { error: "Invalid or expired token" };

  const serviceRole = await createServiceRoleClient();

  const { data: existingUsers, error: lookupError } =
    await serviceRole.auth.admin.listUsers();

  if (lookupError) return { error: lookupError.message };

  const emailConflict = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (emailConflict) {
    const { data: linkedCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("customer_user_id", emailConflict.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkedCustomer && linkedCustomer.id !== customer.id) {
      return { error: "Email is already linked to another account" };
    }
  }

  const { data: newUser, error: createError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) return { error: createError.message };

  const { error: updateError } = await supabase
    .from("customers")
    .update({ customer_user_id: newUser.user.id })
    .eq("id", customer.id);

  if (updateError) return { error: updateError.message };

  redirect("/portal");
}
