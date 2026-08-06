import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  addServicePartSuggestion,
  getServicePartSuggestions,
  removeServicePartSuggestion,
} from "@/lib/services/service-part-suggestions-service";

/**
 * GET /api/organizations/:id/services/:serviceId/suggestions
 * Returns all suggested parts for a service.
 */
export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { serviceId } = params;
    const suggestions = await getServicePartSuggestions(
      supabase,
      orgId,
      serviceId,
    );
    return ok(suggestions);
  },
  { rateLimit: true },
);

/**
 * POST /api/organizations/:id/services/:serviceId/suggestions
 * Add a part suggestion to a service.
 * Body: { partId: string, quantity?: number, notes?: string }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase, user }) => {
    const { serviceId } = params;
    const body = await request.json();
    const suggestion = await addServicePartSuggestion(
      supabase,
      orgId,
      serviceId,
      {
        partId: body.partId,
        quantity: body.quantity,
        notes: body.notes,
      },
      user?.id,
    );
    return created(suggestion);
  },
  { rateLimit: true, subscription: true },
);

/**
 * DELETE /api/organizations/:id/services/:serviceId/suggestions
 * Remove a part suggestion.
 * Query: id (suggestion id to delete)
 */
export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError(
        "validation_error",
        "id query parameter is required",
        400,
      );
    }

    await removeServicePartSuggestion(supabase, orgId, id);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
