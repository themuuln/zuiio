import { createRouteHandlers } from "@/lib/supabase/admin-route";

const teamSeasons = createRouteHandlers("team_seasons", {
  select: "id, team_id, competition_id, teams(name, short_code)",
});

export const GET = teamSeasons.list((query, req) => {
  const competitionId = req.nextUrl.searchParams.get("competition_id");
  return competitionId ? query.eq("competition_id", competitionId) : query;
});
