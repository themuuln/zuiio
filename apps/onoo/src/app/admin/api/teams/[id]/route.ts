import { createRouteHandlers } from "@/lib/supabase/admin-route";

const teams = createRouteHandlers("teams", { select: "*, leagues(name)" });

export const GET = teams.getById();
export const PUT = teams.update();
export const DELETE = teams.remove();
