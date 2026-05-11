import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  createOrganization,
  getUserOrganization,
} from "@/lib/services/organization-service";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/organizations
 * Returns the current user's organization.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const org = await getUserOrganization(user.id);

    return NextResponse.json({ data: org });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations
 * Creates a new organization. Used during the signup/onboarding flow.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const { name, slug } = body;

    const org = await createOrganization({ name, slug }, user.id);

    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
