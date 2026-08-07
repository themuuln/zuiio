import { createRouteHandlers } from "@/lib/supabase/admin-route";

const sports = createRouteHandlers("sports", {
  select: "id, key, name_mn, name_en",
});

export const GET = sports.list();
