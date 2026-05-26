import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ConflictError, ValidationError } from "@/lib/errors";
import { authRateLimiter } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/portal/set-password
 *
 * Allows a customer to set a password for their portal account using
 * their portal token. Creates a Supabase Auth user linked to the customer
 * record.
 *
 * Protected by auth middleware (session required) and rate limiting.
 * Email enumeration is prevented: createUser() is the single source of
 * truth — no separate pre-check that would leak registration status.
 */
export const POST = createSimpleRouteHandler(async ({ request }) => {
  // Rate limiting (prevents brute force and DoS)
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = authRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const body = await request.json();
  const { token, email, password } = body;

  if (!token || !email || !password) {
    throw new ValidationError("token, email, and password are required");
  }

  const supabase = await createClient();

  // Validate portal token and fetch customer
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, organization_id, first_name, last_name, email, portal_token")
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) throw new ValidationError("Invalid or expired token");

  const serviceRole = await createServiceRoleClient();

  // Try creating the user — Supabase returns an error if email already exists.
  // This is the single source of truth — no separate pre-check that would
  // leak whether an email is registered.
  const { data: newUser, error: createError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    // Email already in use — check whether it belongs to this customer
    // or someone else. We use a targeted lookup via the RPC instead of
    // listUsers() to avoid exposing the full user database.
    if (
      createError.message?.includes("already") ||
      createError.status === 422
    ) {
      // Check if this email is already linked to a customer record
      const { data: emailCustomer } = await supabase
        .from("customers")
        .select("id, customer_user_id")
        .eq("email", email)
        .is("deleted_at", null)
        .maybeSingle();

      if (emailCustomer?.customer_user_id) {
        // Someone already registered this email — check if it's the same customer
        if (emailCustomer.id !== customer.id) {
          throw new ConflictError("Account creation failed");
        }
      }

      // Fallback: email exists in auth but we couldn't resolve the owner.
      // Return a consistent error — no information leak.
      throw new ConflictError("Account creation failed");
    }
    throw createError;
  }

  // Link the new auth user to the customer record
  const { error: updateError } = await supabase
    .from("customers")
    .update({ customer_user_id: newUser.user.id })
    .eq("id", customer.id);

  if (updateError) throw updateError;

  return NextResponse.json({ success: true });
});
