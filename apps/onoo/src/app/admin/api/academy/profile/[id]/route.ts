import { createRouteHandlers } from "@/lib/supabase/admin-route";

const profile = createRouteHandlers("academy_profiles");

export const GET = profile.getById();
export const PUT = profile.update();
export const DELETE = profile.remove();
