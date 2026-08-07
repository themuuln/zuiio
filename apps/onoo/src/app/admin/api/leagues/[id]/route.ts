import { createRouteHandlers } from "@/lib/supabase/admin-route";

const leagues = createRouteHandlers("leagues", {
  select: "*, sports(name_en, name_mn)",
});

export const GET = leagues.getById();
export const PUT = leagues.update();
export const DELETE = leagues.remove();
