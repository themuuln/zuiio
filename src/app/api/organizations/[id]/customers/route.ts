import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createCustomer,
  getCustomers,
  getSharedCustomers,
  searchCustomers,
} from "@/lib/services/customer-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const searchQuery = request.nextUrl.searchParams.get("q") ?? undefined;
    const page = Number(request.nextUrl.searchParams.get("page")) || undefined;
    const pageSize =
      Number(request.nextUrl.searchParams.get("pageSize")) || undefined;
    const shared = request.nextUrl.searchParams.get("shared") === "true";
    const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;

    const commonOptions = {
      page,
      pageSize,
      ...(branchId ? { branchId } : {}),
    };

    if (shared) {
      const result = await getSharedCustomers(supabase, orgId, {
        search: searchQuery,
        ...commonOptions,
      });
      return NextResponse.json({ data: result });
    }

    const result = searchQuery
      ? await searchCustomers(supabase, orgId, searchQuery, commonOptions)
      : await getCustomers(supabase, orgId, {
          search: undefined,
          ...commonOptions,
        });

    return NextResponse.json({ data: result });
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const body = await request.json();
    const customer = await createCustomer(supabase, orgId, body, user.id);
    return NextResponse.json({ data: customer }, { status: 201 });
  },
  { requiredPermission: { resource: "customers", action: "create" } },
);
