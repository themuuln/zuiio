import { type NextRequest, NextResponse } from "next/server";
import { createOrganization } from "@/lib/services/organization-service";
import { createClient } from "@/lib/supabase/server";

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

/**
 * POST /api/auth/finalize-signup
 *
 * Creates user profile and initial organization after first signup.
 * Called by the client after the auth callback redirect completes.
 * Uses POST so browsers/crawlers cannot prefetch or replay this mutation.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return NextResponse.json(
        { error: { message: "Not authenticated" } },
        { status: 401 },
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ data: { status: "already_setup" } });
    }

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const orgName =
      (meta?.org_name as string) ||
      (meta?.organization_name as string) ||
      `Shop of ${user.email ?? "user"}`;
    const orgSlug =
      slugify(orgName) || `org-${user.id.slice(0, 8)}`;

    // Check if an org with this slug already exists (e.g. seeded demo org)
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", orgSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingOrg) {
      // Join existing org instead of creating a duplicate
      const [{ data: branch }, { data: adminRole }] = await Promise.all([
        supabase
          .from("branches")
          .select("id")
          .eq("organization_id", existingOrg.id)
          .eq("is_main", true)
          .is("deleted_at", null)
          .single(),
        supabase
          .from("roles")
          .select("id")
          .eq("organization_id", existingOrg.id)
          .eq("name", "Admin")
          .is("deleted_at", null)
          .single(),
      ]);

      await supabase.from("organization_users").insert({
        organization_id: existingOrg.id,
        user_id: user.id,
        role_id: adminRole?.id ?? null,
        branch_id: branch?.id ?? null,
        is_primary: true,
      });

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          organization_id: existingOrg.id,
          branch_id: branch?.id ?? null,
          is_active: true,
        },
        { onConflict: "id" },
      );
    } else {
      await createOrganization({ name: orgName, slug: orgSlug }, user.id);
    }

    return NextResponse.json({ data: { status: "created" } });
  } catch (err) {
    console.error("Failed to finalize signup:", err);
    return NextResponse.json(
      { error: { message: "Failed to finalize signup" } },
      { status: 500 },
    );
  }
}
