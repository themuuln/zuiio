import { type NextRequest, NextResponse } from "next/server";
import { createOrganization } from "@/lib/services/organization-service";
import { createClient } from "@/lib/supabase/server";

/**
 * Transliterate Cyrillic characters to Latin, then slugify.
 */
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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/select-organization";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After successful email confirmation, create org + profile if needed
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          // Check if profile already exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!existingProfile) {
            const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
            const orgName =
              (meta?.org_name as string) ||
              (meta?.organization_name as string) ||
              `Shop of ${user.email ?? "user"}`;
            const orgSlug = slugify(orgName) || `org-${user.id.slice(0, 8)}`;

            // Check if an org with this slug already exists (e.g. seeded demo org)
            const { data: existingOrg } = await supabase
              .from("organizations")
              .select("id, name")
              .eq("slug", orgSlug)
              .is("deleted_at", null)
              .maybeSingle();

            if (existingOrg) {
              // Join existing org instead of creating a duplicate
              const { data: branch } = await supabase
                .from("branches")
                .select("id")
                .eq("organization_id", existingOrg.id)
                .eq("is_main", true)
                .is("deleted_at", null)
                .single();

              const { data: adminRole } = await supabase
                .from("roles")
                .select("id")
                .eq("organization_id", existingOrg.id)
                .eq("name", "Admin")
                .is("deleted_at", null)
                .single();

              await supabase.from("organization_users").insert({
                organization_id: existingOrg.id,
                user_id: user.id,
                role_id: adminRole?.id ?? null,
                branch_id: branch?.id ?? null,
                is_primary: true,
              });

              await supabase.from("profiles").upsert({
                id: user.id,
                organization_id: existingOrg.id,
                branch_id: branch?.id ?? null,
                is_active: true,
              });
            } else {
              await createOrganization(
                { name: orgName, slug: orgSlug },
                user.id,
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to auto-create organization in callback:", err);
        // Non-fatal — admin can create org manually or re-trigger
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_error`,
  );
}
