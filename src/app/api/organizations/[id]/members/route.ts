import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { normalizeMongolianPhone } from "@/lib/form-validation";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface AddMemberParams {
  email?: string;
  identifier?: string;
  password: string;
  fullName: string;
  roleId: string;
}

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
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
    const { email, identifier, password, fullName, roleId } = body;
    const inputIdentifier = (identifier || email)?.trim();

    if (!inputIdentifier) {
      throw new ValidationError("Username, phone, or email is required");
    }
    if (!password || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }
    if (!roleId) {
      throw new ValidationError("Role is required");
    }

    type IdentifierType = "email" | "phone" | "username";
    function detectIdentifierType(value: string): IdentifierType {
      if (value.includes("@") && !value.endsWith("@tolom.auth")) return "email";
      const digits = value.replace(/[\s\-()]/g, "");
      if (/^\+?\d{7,15}$/.test(digits)) return "phone";
      return "username";
    }

    const type = detectIdentifierType(inputIdentifier);
    let authEmail: string;
    let usernameValue: string | undefined;
    let phoneValue: string | undefined;

    const serviceRole = await createServiceRoleClient();
    const supabase = await createClient();

    if (type === "email") {
      authEmail = inputIdentifier;
    } else if (type === "phone") {
      phoneValue = normalizeMongolianPhone(inputIdentifier);
      authEmail = `phone_${phoneValue.replace(/[^0-9]/g, "")}@tolom.auth`;

      // Check if phone already in use in profiles
      const { data: existingPhone } = await serviceRole
        .from("profiles")
        .select("id")
        .eq("phone", phoneValue)
        .maybeSingle();
      if (existingPhone) {
        throw new ValidationError("Phone number is already in use");
      }
    } else {
      // type === "username"
      usernameValue = inputIdentifier.toLowerCase();
      if (!/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
        throw new ValidationError(
          "Username can only contain letters, numbers, and underscores",
        );
      }
      if (usernameValue.length < 3 || usernameValue.length > 30) {
        throw new ValidationError(
          "Username must be between 3 and 30 characters",
        );
      }
      authEmail = `username_${usernameValue.toLowerCase()}@tolom.auth`;

      // Check if username already in use in profiles
      const { data: existingUsername } = await serviceRole
        .from("profiles")
        .select("id")
        .eq("username", usernameValue)
        .maybeSingle();
      if (existingUsername) {
        throw new ValidationError("Username is already in use");
      }
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await serviceRole.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === authEmail.toLowerCase(),
    );

    let userId: string;
    let existingMember: { user_id: string; removed_at: string | null } | null =
      null;

    const isReactivation =
      !!existingUser &&
      (await (async () => {
        const { data: existingMemberCheck } = await supabase
          .from("organization_users")
          .select("user_id, removed_at")
          .eq("organization_id", orgId)
          .eq("user_id", existingUser!.id)
          .maybeSingle();

        existingMember = existingMemberCheck;

        if (!existingMemberCheck) return false;

        if (existingMemberCheck.removed_at) {
          // Re-activate a previously removed member
          await supabase
            .from("organization_users")
            .update({ removed_at: null, role_id: roleId })
            .eq("user_id", existingUser!.id)
            .eq("organization_id", orgId);
          return true;
        }

        throw new ValidationError(
          "User is already a member of this organization",
        );
      })());

    if (existingUser) {
      // User already exists in auth, just add to organization
      userId = existingUser.id;

      if (isReactivation) {
        // Skip the insert below — already handled
      }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } =
        await serviceRole.auth.admin.createUser({
          email: authEmail.toLowerCase(),
          password,
          email_confirm: true, // Auto-confirm since admin is creating
        });

      if (createError) {
        throw new ValidationError(createError.message);
      }

      userId = newUser.user.id;

      const profileData: {
        id: string;
        organization_id: string;
        full_name: string | null;
        is_active: boolean;
        username?: string;
        phone?: string;
      } = {
        id: userId,
        organization_id: orgId,
        full_name: fullName.trim() || null,
        is_active: true,
      };
      if (usernameValue) profileData.username = usernameValue;
      if (phoneValue) profileData.phone = phoneValue;

      const { error: profileError } = await serviceRole
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        // Rollback: delete the auth user if profile creation fails
        await serviceRole.auth.admin.deleteUser(userId);
        throw new ValidationError("Failed to create user profile");
      }
    }

    // Add to organization (skip if this was a reactivation)
    if (!existingMember) {
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
    }

    return NextResponse.json(
      {
        data: {
          userId,
          identifier: inputIdentifier,
          email: authEmail,
          password, // Return password so admin can share
          fullName: fullName.trim(),
          isNewUser: !existingUser,
        },
      },
      { status: 201 },
    );
  },
  { requiredPermission: { resource: "members", action: "update" } },
);
