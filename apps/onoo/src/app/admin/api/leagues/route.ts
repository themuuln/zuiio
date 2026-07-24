import { createRouteHandlers } from "@/lib/supabase/admin-route";

const DEFAULT_ORG_ID =
  process.env.ADMIN_ORG_ID ?? "b0000000-0000-0000-0000-000000000001";

const leagues = createRouteHandlers("leagues", {
  select: "*, sports(name_en, name_mn)",
});

export const GET = leagues.list();

export const POST = leagues.create((body) => {
  const { name, slug, sport_id, organization_id } = body;
  if (!name || !slug || !sport_id) {
    return { insert: body, validate: "name, slug, and sport_id are required" };
  }
  return {
    name,
    slug,
    sport_id,
    organization_id: organization_id ?? DEFAULT_ORG_ID,
  };
});
