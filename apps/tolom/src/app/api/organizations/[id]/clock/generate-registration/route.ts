import { apiError, created, createRouteHandler } from "@/lib/api-response";
import { generateRegistrationToken } from "@/lib/services/qr-token-service";

export { dynamic } from "@/lib/api-handler";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as { mechanicId: string };
    if (!body.mechanicId) {
      return apiError("BAD_REQUEST", "mechanicId is required", 400);
    }

    const token = await generateRegistrationToken(
      supabase,
      orgId,
      body.mechanicId,
    );
    return created(token);
  },
  { rateLimit: true },
);
