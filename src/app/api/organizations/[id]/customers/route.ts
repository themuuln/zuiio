import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createCustomer, getCustomers, searchCustomers } from "@/lib/services/customer-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const searchQuery = request.nextUrl.searchParams.get("q") ?? undefined;
  const page = Number(request.nextUrl.searchParams.get("page")) || undefined;
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize")) || undefined;

  const result = searchQuery
    ? await searchCustomers(orgId, searchQuery, { page, pageSize })
    : await getCustomers(orgId, { search: undefined, page, pageSize });

  return NextResponse.json({ data: result });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const body = await request.json();
  const customer = await createCustomer(orgId, body, user.id);
  return NextResponse.json({ data: customer }, { status: 201 });
});
