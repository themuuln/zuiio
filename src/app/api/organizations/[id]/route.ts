import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/organization-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organizations/[id]
 * Returns a single organization by ID.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const { id } = await context.params;
    const org = await getOrganization(id);

    return NextResponse.json({ data: org });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/organizations/[id]
 * Updates an organization's name or settings.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const { id } = await context.params;
    const body = await request.json();

    const org = await updateOrganization(id, body);

    return NextResponse.json({ data: org });
  } catch (error) {
    return handleApiError(error);
  }
}
