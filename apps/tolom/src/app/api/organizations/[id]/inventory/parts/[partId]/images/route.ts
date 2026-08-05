import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  addPartImage,
  getPartImages,
  removePartImage,
  setPrimaryImage,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { partId } = params;
    const images = await getPartImages(supabase, orgId, partId);
    return ok(images);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase, user }) => {
    const { partId } = params;
    const body = await request.json();
    const { image_url, is_primary } = body;

    if (!image_url) {
      return apiError("VALIDATION", "image_url is required", 400);
    }

    const image = await addPartImage(
      supabase,
      orgId,
      partId,
      image_url,
      is_primary ?? false,
      user.id,
    );
    return created(image);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase, user }) => {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");
    if (!imageId) {
      return apiError("VALIDATION", "imageId is required", 400);
    }
    await removePartImage(supabase, orgId, imageId, user.id);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase, user }) => {
    const { partId } = params;
    const body = await request.json();

    if (body.action === "set-primary") {
      if (!body.image_id) {
        return apiError("VALIDATION", "image_id is required", 400);
      }
      const image = await setPrimaryImage(
        supabase,
        orgId,
        partId,
        body.image_id,
        user.id,
      );
      return ok(image);
    }

    return apiError("VALIDATION", "Unknown action", 400);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
