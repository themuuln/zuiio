import { createRouteHandlers } from "@/lib/supabase/admin-route";

const competitions = createRouteHandlers("competitions", {
  select: "id, name, type, season_id, created_at",
});

export const GET = competitions.list();
