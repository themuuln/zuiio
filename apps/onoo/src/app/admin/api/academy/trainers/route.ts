import { createRouteHandlers } from "@/lib/supabase/admin-route";

const trainers = createRouteHandlers("academy_trainers");

export const GET = trainers.list();
export const POST = trainers.create();
