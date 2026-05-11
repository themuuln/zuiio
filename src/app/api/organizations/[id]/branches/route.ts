import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { createBranch, getBranches } from "@/lib/services/branch-service";
import { createClient } from "@/lib/supabase/server";
import type { CreateBranchParams } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organizations/[id]/branches
 * Lists all branches for the given organization.
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
    const branches = await getBranches(orgId);

    return NextResponse.json({ data: branches });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[id]/branches
 * Creates a new branch for the organization.
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
    const body: CreateBranchParams = await request.json();

    const branch = await createBranch(orgId, body);

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
