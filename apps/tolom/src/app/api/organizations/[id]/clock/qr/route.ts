import { apiError, created, createRouteHandler } from "@/lib/api-response";
import { generateClockToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as {
      actionType: "clock_in" | "clock_out";
    };
    if (
      !body.actionType ||
      !["clock_in", "clock_out"].includes(body.actionType)
    ) {
      return apiError(
        "BAD_REQUEST",
        "actionType must be 'clock_in' or 'clock_out'",
        400,
      );
    }

    const token = await generateClockToken(supabase, orgId, body.actionType);
    return created(token);
  },
  { rateLimit: true },
);
