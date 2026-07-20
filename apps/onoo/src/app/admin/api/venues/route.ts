import { createRouteHandlers } from "@/lib/supabase/admin-route";

const venues = createRouteHandlers("venues", {
  select: "id, name, city, capacity",
});

export const GET = venues.list();
