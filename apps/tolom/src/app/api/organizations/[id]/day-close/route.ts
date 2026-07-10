import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { closeDay, getDayCloseStatus } from "@/lib/services/day-close-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const status = await getDayCloseStatus(supabase, orgId, date);
  return ok(status);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const date = body.date ?? new Date().toISOString().split("T")[0];
    const userId = user.id;

    const result = await closeDay(supabase, orgId, userId, date);
    return ok(result);
  },
);
