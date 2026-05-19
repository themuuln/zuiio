import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { handleApiError, ValidationError, ConflictError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      throw new ValidationError("token, email, and password are required");
    }

    const supabase = await createClient();

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("portal_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer) throw new ValidationError("Invalid or expired token");

    const serviceRole = await createServiceRoleClient();

    const { data: existingUsers, error: lookupError } =
      await serviceRole.auth.admin.listUsers();

    if (lookupError) throw lookupError;

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
        throw new ConflictError("Email is already linked to another account");
      }
    }

    const { data: newUser, error: createError } =
      await serviceRole.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) throw createError;

    const { error: updateError } = await supabase
      .from("customers")
      .update({ customer_user_id: newUser.user.id })
      .eq("id", customer.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
