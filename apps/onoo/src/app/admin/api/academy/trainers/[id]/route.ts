import { createRouteHandlers } from "@/lib/supabase/admin-route";

const trainers = createRouteHandlers("academy_trainers");

export const GET = trainers.getById();
export const PUT = trainers.update();
export const DELETE = trainers.remove();
