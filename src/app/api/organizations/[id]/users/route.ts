import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  addUserToOrganization,
  getOrganizationUsers,
} from "@/lib/services/user-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organizations/[id]/users
 * Lists all users belonging to the organization.
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

    const { id: orgId } = await context.params;
    const users = await getOrganizationUsers(orgId);

    return NextResponse.json({ data: users });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[id]/users
 * Adds a user to the organization by user ID.
 * In Phase 0, the caller must provide the user's auth ID directly.
 * A full invite-via-email flow will be added when the admin API is wired.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const { id: orgId } = await context.params;
    const body = await request.json();
    const { userId, roleId } = body;

    await addUserToOrganization(orgId, userId, roleId);

    return NextResponse.json({ data: { success: true } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
