import { createRouteHandlers } from "@/lib/supabase/admin-route";

const programs = createRouteHandlers("academy_programs");

export const GET = programs.list();
export const POST = programs.create();
