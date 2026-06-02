import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ── Types ─────────────────────────────────────────────────────

export interface FinalizeSignupResult {
  status: "created" | "already_setup";
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Generate a unique slug by appending a suffix if the base slug is taken.
 * Checks existing AND soft-deleted orgs because the DB unique constraint is global.
 */
async function generateUniqueSlug(
  adminClient: SupabaseClient,
  baseSlug: string,
): Promise<string> {
  const { data: existing } = await adminClient
    .from("organizations")
    .select("slug")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (!existing) return baseSlug;

  // Slug taken — append a suffix
  return `${baseSlug.slice(0, 51)}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Transliterate Cyrillic → Latin, then slugify. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ү: "u",
  ө: "o",
  ң: "ng",
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
 * Finalizes a new user's signup by creating a fresh organization
 * (never joining an existing one by slug) and setting up their profile,
 * roles, branch, and membership.
 *
 * Idempotent: if the user already has a profile or membership, returns
 * `already_setup` instead of failing. Slugs are guaranteed unique via
 * suffix generation. Organization membership uses upsert to survive retries.
 *
 * Uses the authenticated client for auth verification and the service-role
 * client for DB mutations to bypass RLS — necessary because the user is
 * not yet an org member when the first org is created.
 */
export interface FinalizeSignupOptions {
  /** Override org name from user_metadata. If omitted, falls back to
   *  metadata → email-based default. */
  orgName?: string;
}

export async function finalizeSignup(
  supabase: SupabaseClient,
  options?: FinalizeSignupOptions,
): Promise<FinalizeSignupResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    throw new AppError("Not authenticated", "UNAUTHORIZED", 401);
  }

  // Use service-role client for DB mutations to bypass RLS
  const adminClient = await createServiceRoleClient();

  const meta = (user.user_metadata ?? {}) as unknown as Record<string, unknown>;
  const orgName =
    options?.orgName?.trim() ||
    (meta?.org_name as string) ||
    (meta?.organization_name as string) ||
    `Shop of ${user.email ?? "user"}`;
  const orgSlug = slugify(orgName) || `org-${user.id.slice(0, 8)}`;
  const userFullName =
    (meta?.full_name as string) || (meta?.name as string) || null;

  // Check for existing membership before proceeding — this covers retries
  const { data: existingMembership } = await adminClient
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();

  if (existingMembership) {
    // Already a member of an org — upsert profile and return
    await adminClient.from("profiles").upsert(
      {
        id: user.id,
        organization_id: existingMembership.organization_id,
        is_active: true,
        full_name: userFullName,
      },
      { onConflict: "id" },
    );
    return { status: "already_setup" };
  }

  // Generate a unique slug — do NOT join an existing org by slug
  // (a new registrant should never inherit Admin of an unrelated org)
  const finalSlug = await generateUniqueSlug(adminClient, orgSlug);

  await bootstrapOrganization(adminClient, {
    name: orgName,
    slug: finalSlug,
    userId: user.id,
    userFullName,
  });
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
    .select(
      "id, name, slug, settings, is_active, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  // The database trigger automatically seeds standard roles and permissions.
  // Fetch the created "Org Owner" role.
  const { data: adminRole, error: adminRoleError } = await adminClient
    .from("roles")
    .select("id")
    .eq("organization_id", org.id)
    .eq("name", "Org Owner")
    .is("deleted_at", null)
    .single();

  if (adminRoleError || !adminRole) {
    throw new Error(
      adminRoleError?.message ?? "Failed to resolve Org Owner role",
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

  // Use upsert so retries don't fail on duplicate membership
  const { error: memberError } = await adminClient
    .from("organization_users")
    .upsert(
      {
        organization_id: org.id,
        user_id: userId,
        role_id: adminRole.id,
        branch_id: branch.id,
        is_primary: true,
      },
      { onConflict: "organization_id,user_id" },
    );

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
