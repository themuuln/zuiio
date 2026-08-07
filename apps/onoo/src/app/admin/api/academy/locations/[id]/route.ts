import { createRouteHandlers } from "@/lib/supabase/admin-route";

const locations = createRouteHandlers("academy_locations");

export const GET = locations.getById();
export const PUT = locations.update();
export const DELETE = locations.remove();
