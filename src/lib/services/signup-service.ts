import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { AppError } from "@/lib/errors";

// ── Types ─────────────────────────────────────────────────────

export interface FinalizeSignupResult {
  status: "created" | "already_setup";
}

// ── Helpers ───────────────────────────────────────────────────

/** Transliterate Cyrillic → Latin, then slugify. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ү: "u", ө: "o", ң: "ng",
};

function slugify(name: string): string {
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── Main Service ──────────────────────────────────────────────

/**
 * Finalizes a new user's signup by creating the organization (or joining
 * an existing one) and setting up their profile, roles, branch, and
 * membership.
 *
 * Uses the authenticated client for auth verification and the service-role
 * client for DB mutations to bypass RLS — necessary because the user is
 * not yet an org member when the first org is created.
 */
export async function finalizeSignup(
  supabase: SupabaseClient,
): Promise<FinalizeSignupResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    throw new AppError("Not authenticated", "UNAUTHORIZED", 401);
  }

  // Use service-role client for DB mutations to bypass RLS
  const adminClient = await createServiceRoleClient();

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return { status: "already_setup" };
  }

  const meta = (user.user_metadata ?? {}) as unknown as Record<string, unknown>;
  const orgName =
    (meta?.org_name as string) ||
    (meta?.organization_name as string) ||
    `Shop of ${user.email ?? "user"}`;
  const orgSlug = slugify(orgName) || `org-${user.id.slice(0, 8)}`;
  const userFullName =
    (meta?.full_name as string) || (meta?.name as string) || null;

  const { data: existingOrg } = await adminClient
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingOrg) {
    const [{ data: branch }, { data: adminRole }] = await Promise.all([
      adminClient
        .from("branches")
        .select("id")
        .eq("organization_id", existingOrg.id)
        .eq("is_main", true)
        .is("deleted_at", null)
        .single(),
      adminClient
        .from("roles")
        .select("id")
        .eq("organization_id", existingOrg.id)
        .eq("name", "Admin")
        .is("deleted_at", null)
        .single(),
    ]);

    await adminClient.from("organization_users").insert({
      organization_id: existingOrg.id,
      user_id: user.id,
      role_id: adminRole?.id ?? null,
      branch_id: branch?.id ?? null,
      is_primary: true,
    });

    await adminClient.from("profiles").upsert(
      {
        id: user.id,
        organization_id: existingOrg.id,
        branch_id: branch?.id ?? null,
        is_active: true,
        full_name: userFullName,
      },
      { onConflict: "id" },
    );
  } else {
    // Bootstrap org with service-role client — the createOrganization
    // service uses the regular client and would fail RLS since the user
    // isn't an org member yet.
    await bootstrapOrganization(adminClient, {
      name: orgName,
      slug: orgSlug,
      userId: user.id,
      userFullName,
    });
  }

  return { status: "created" };
}

// ── Internal: bootstrap a new org with full setup ────────────

interface BootstrapParams {
  name: string;
  slug: string;
  userId: string;
  userFullName: string | null;
}

async function bootstrapOrganization(
  adminClient: SupabaseClient,
  params: BootstrapParams,
) {
  const { name, slug, userId, userFullName } = params;

  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      settings: {},
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id, name, slug, settings, is_active, created_by, updated_by, created_at, updated_at")
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  const { data: adminRole, error: adminRoleError } = await adminClient
    .from("roles")
    .insert({
      organization_id: org.id,
      name: "Admin",
      is_system: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (adminRoleError || !adminRole) {
    throw new Error(adminRoleError?.message ?? "Failed to create Admin role");
  }

  const { error: mechanicRoleError } = await adminClient.from("roles").insert({
    organization_id: org.id,
    name: "Mechanic",
    is_system: true,
    created_by: userId,
    updated_by: userId,
  });

  if (mechanicRoleError) {
    throw new Error(
      mechanicRoleError?.message ?? "Failed to create Mechanic role",
    );
  }

  const { data: branch, error: branchError } = await adminClient
    .from("branches")
    .insert({
      organization_id: org.id,
      name: "Main Branch",
      is_main: true,
      settings: {},
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (branchError || !branch) {
    throw new Error(branchError?.message ?? "Failed to create default branch");
  }

  const { error: memberError } = await adminClient
    .from("organization_users")
    .insert({
      organization_id: org.id,
      user_id: userId,
      role_id: adminRole.id,
      branch_id: branch.id,
      is_primary: true,
    });

  if (memberError) {
    throw new Error(
      memberError.message ?? "Failed to add user to organization",
    );
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId,
    organization_id: org.id,
    branch_id: branch.id,
    is_active: true,
    full_name: userFullName,
  });

  if (profileError) {
    console.error("Failed to upsert profile:", profileError.message);
  }

  // Create default subscription (non-critical — log but don't fail)
  try {
    await adminClient.rpc("create_default_subscription", {
      target_org_id: org.id,
    });
  } catch (subError) {
    console.error("Failed to create default subscription:", subError);
  }
}
