import { createRouteHandler } from "@/lib/api-handler";
import { created } from "@/lib/api-response";
import { invalidateReportCache } from "@/lib/cache/server";
import { ValidationError } from "@/lib/errors";
import { normalizeMongolianPhone } from "@/lib/form-validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export { dynamic } from "@/lib/api-handler";

interface AddMemberParams {
  email?: string;
  identifier?: string;
  password: string;
  fullName: string;
  roleId: string;
}

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
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
      // Derive username from the email (strip @domain, lowercase, keep alphanumeric/underscore)
      const emailPrefix = inputIdentifier
        .split("@")[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");
      usernameValue = emailPrefix.slice(0, 30);
    } else if (type === "phone") {
      phoneValue = normalizeMongolianPhone(inputIdentifier);
      authEmail = `phone_${phoneValue.replace(/[^0-9]/g, "")}@tolom.auth`;
      // Derive username from the normalized phone number
      usernameValue = `p${phoneValue.replace(/[^0-9]/g, "").slice(0, 20)}`;

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

    // Check if user already exists in auth.
    // Supabase listUsers() doesn't support email filtering, so we paginate
    // in small chunks and stop as soon as we find a match (or exhaust pages).
    let existingUser: { id: string; email?: string } | null = null;
    const PAGE_SIZE = 100;
    for (let page = 1; page <= 10; page++) {
      const { data: pageData } = await serviceRole.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });
      const users = pageData?.users ?? [];
      existingUser =
        users.find((u) => u.email?.toLowerCase() === authEmail.toLowerCase()) ??
        null;
      if (existingUser || users.length < PAGE_SIZE) break;
    }

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
          .eq("user_id", existingUser?.id)
          .maybeSingle();

        existingMember = existingMemberCheck;

        if (!existingMemberCheck) return false;

        if (existingMemberCheck.removed_at) {
          // Re-activate a previously removed member
          await supabase
            .from("organization_users")
            .update({ removed_at: null, role_id: roleId })
            .eq("user_id", existingUser?.id)
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

    // Invalidate mechanics list cache so admin sees the new member immediately
    invalidateReportCache(orgId);

    return created({
      userId,
      identifier: inputIdentifier,
      email: authEmail,
      fullName: fullName.trim(),
      isNewUser: !existingUser,
    });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "members", action: "update" },
  },
);
