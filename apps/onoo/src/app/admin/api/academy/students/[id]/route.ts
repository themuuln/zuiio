import { createRouteHandlers } from "@/lib/supabase/admin-route";

const students = createRouteHandlers("academy_students");

export const DELETE = students.remove();
