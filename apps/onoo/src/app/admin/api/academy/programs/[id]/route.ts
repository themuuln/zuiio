import { createRouteHandlers } from "@/lib/supabase/admin-route";

const programs = createRouteHandlers("academy_programs");

export const GET = programs.getById();
export const PUT = programs.update();
export const DELETE = programs.remove();
