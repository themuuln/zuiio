import { createRouteHandlers } from "@/lib/supabase/admin-route";

const players = createRouteHandlers("players", { select: "*" });

export const GET = players.getById();
export const PUT = players.update();
export const DELETE = players.remove();
