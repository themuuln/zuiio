import { created, createRouteHandler, ok } from "@/lib/api-response";
import {

  createCustomer,
  getCustomers,
  getCustomersFast,
  getSharedCustomers,
  searchCustomers,
} from "@/lib/services/customer-service";
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
      return ok(result);
    }

    const fast =
      request.nextUrl.searchParams.get("fast") === "true" && !branchId;
    if (fast) {
      const rows = await getCustomersFast(supabase, orgId, {
        search: searchQuery,
        limit: pageSize ?? 50,
      });
      return ok({
        data: rows,
        total: rows.length,
        page: page ?? 1,
        pageSize: pageSize ?? 50,
        totalPages: 1,
      });
    }

    const result = searchQuery
      ? await searchCustomers(supabase, orgId, searchQuery, commonOptions)
      : await getCustomers(supabase, orgId, {
          search: undefined,
          ...commonOptions,
        });

    return ok(result);
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const customer = await createCustomer(supabase, orgId, body, user.id);
    return created(customer);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "customers", action: "create" },
  },
);
