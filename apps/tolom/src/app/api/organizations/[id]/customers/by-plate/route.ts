import { createRouteHandler, ok } from "@/lib/api-response";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import type { Customer } from "@/lib/types";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const rawPlate = url.searchParams.get("plate")?.trim();
  const plate = rawPlate ? transliterateMongolianPlate(rawPlate) : undefined;

  if (!plate) return ok([]);

  const plateQuery = `%${plate}%`;

  const { data, error } = await supabase
    .from("vehicles")
    .select("vehicle_owners!inner(customers(*))")
    .ilike("plate_number", plateQuery)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .is("vehicle_owners.owned_until", null)
    .limit(5);

  if (error) throw new Error(error.message);

  const customerMap = new Map<string, Customer>();
  for (const row of data ?? []) {
    const owners = row.vehicle_owners as unknown as {
      customers?: Customer | Customer[];
    }[];
    const ownerCustomer = owners?.[0]?.customers;
    const customer = Array.isArray(ownerCustomer)
      ? ownerCustomer[0]
      : ownerCustomer;
    if (customer) customerMap.set(customer.id, customer);
  }

  return ok(Array.from(customerMap.values()));
});
