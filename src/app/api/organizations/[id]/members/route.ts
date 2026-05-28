import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/errors";

interface AddMemberParams {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
}

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
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

  const body = (await request.json()) as AddMemberParams;
  const { email, password, fullName, roleId } = body;

  if (!email?.trim()) {
    throw new ValidationError("Email is required");
  }
  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (!roleId) {
    throw new ValidationError("Role is required");
  }

  const serviceRole = await createServiceRoleClient();
  const supabase = await createClient();

  // Check if user already exists in auth
  const { data: existingUsers } = await serviceRole.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase().trim(),
  );

  let userId: string;

  if (existingUser) {
    // User already exists in auth, just add to organization
    userId = existingUser.id;

    // Check if already in this organization
    const { data: existingMember } = await supabase
      .from("organization_users")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      throw new ValidationError(
        "User is already a member of this organization",
      );
    }
  } else {
    // Create new auth user
    const { data: newUser, error: createError } =
      await serviceRole.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true, // Auto-confirm since admin is creating
      });

    if (createError) {
      throw new ValidationError(createError.message);
    }

    userId = newUser.user.id;

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      organization_id: orgId,
      full_name: fullName.trim() || null,
      is_active: true,
    });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await serviceRole.auth.admin.deleteUser(userId);
      throw new ValidationError("Failed to create user profile");
    }
  }

  // Add to organization
  const { error: memberError } = await supabase
    .from("organization_users")
    .insert({
      organization_id: orgId,
      user_id: userId,
      role_id: roleId,
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    throw new ValidationError("Failed to add user to organization");
  }

  return NextResponse.json(
    {
      data: {
        userId,
        email: email.toLowerCase().trim(),
        password, // Return password so admin can share
        fullName: fullName.trim(),
        isNewUser: !existingUser,
      },
    },
    { status: 201 },
  );
});
