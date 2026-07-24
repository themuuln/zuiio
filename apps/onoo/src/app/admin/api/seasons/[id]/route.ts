import { createRouteHandlers } from "@/lib/supabase/admin-route";

const seasons = createRouteHandlers("seasons", { select: "*, leagues(name)" });

export const GET = seasons.getById();
export const PUT = seasons.update();
export const DELETE = seasons.remove();
