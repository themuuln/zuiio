import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheTags } from "@/lib/cache/keys";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { withDbCapture } from "@/lib/supabase/query";
import type {
  CreateCustomerParams,
  Customer,
  CustomerWithVehicleCount,
  PaginatedResponse,
  UpdateCustomerParams,
} from "@/lib/types";
import { createCrudService } from "./create-crud-service";
import { trimField } from "./trim-field";

// ── Factory-backed CRUD ───────────────────────────────────────

const crud = createCrudService<
  Customer,
  CreateCustomerParams,
  UpdateCustomerParams
>({
  tableName: "customers",
  selectColumns:
    "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, total_visits, last_visit_at, source, tags, created_at, updated_at",
  selectColumnsById:
    "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, portal_token, customer_user_id, created_at, updated_at, created_by, updated_by",
  cacheTagKey: (orgId: string) => cacheTags.customers(orgId),
  fieldMap: {
    columns: {
      type: "type",
      firstName: "first_name",
      lastName: "last_name",
      companyName: "company_name",
      contactPerson: "contact_person",
      phone: "phone",
      email: "email",
      address: "address",
      notes: "notes",
      source: "source",
    },
    transforms: {
      firstName: trimField,
      lastName: trimField,
      companyName: trimField,
      contactPerson: trimField,
      phone: trimField,
      email: trimField,
      address: trimField,
      notes: trimField,
      source: trimField,
    },
  },
  hooks: {
    // Search/filter support for getAll
    onQuery: (query, options) => {
      const search = options?.search as string | undefined;
      if (search?.trim()) {
        const term = `%${search.trim()}%`;
        // biome-ignore lint/suspicious/noExplicitAny: factory hook type is PostgrestQueryBuilder lacking or()
        return (query as any).or(
          `first_name.ilike.${term},last_name.ilike.${term},full_name.ilike.${term},company_name.ilike.${term},contact_person.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
        );
      }
      return query;
    },
    // Validation + duplicate warnings before create
    beforeCreate: async (params, ctx) => {
      if (
        !params.phone?.trim() &&
        !params.email?.trim() &&
        !params.firstName?.trim() &&
        !params.companyName?.trim() &&
        !params.contactPerson?.trim()
      ) {
        throw new ValidationError("At least one identifying field is required");
      }

      // Check for duplicate phone (warn only — don't block)
      if (params.phone?.trim()) {
        const { data: existing } = await withDbCapture(
          "beforeCreate:phoneDup",
          ctx.db
            .from("customers")
            .select("id, first_name, last_name, company_name, phone")
            .eq("organization_id", ctx.orgId)
            .eq("phone", params.phone.trim())
            .is("deleted_at", null)
            .maybeSingle(),
        );
        if (existing) {
          const existingName =
            [existing.first_name, existing.last_name]
              .filter(Boolean)
              .join(" ") ||
            existing.company_name ||
            existing.phone;
          logger.warn(
            {
              existingCustomerId: existing.id,
              existingName,
              phone: params.phone.trim(),
            },
            `Phone ${params.phone.trim()} already belongs to "${existingName}" (${existing.id})`,
          );
        }
      }

      // Check for duplicate email (warn only — don't block)
      if (params.email?.trim()) {
        const { data: existing } = await withDbCapture(
          "beforeCreate:emailDup",
          ctx.db
            .from("customers")
            .select("id, first_name, last_name, company_name, email")
            .eq("organization_id", ctx.orgId)
            .eq("email", params.email.trim())
            .is("deleted_at", null)
            .maybeSingle(),
        );
        if (existing) {
          const existingName =
            [existing.first_name, existing.last_name]
              .filter(Boolean)
              .join(" ") ||
            existing.company_name ||
            existing.email;
          logger.warn(
            {
              existingCustomerId: existing.id,
              existingName,
              email: params.email.trim(),
            },
            `Email ${params.email.trim()} already belongs to "${existingName}" (${existing.id})`,
          );
        }
      }

      return {
        type: params.type ?? "individual",
        first_name: params.firstName?.trim() || null,
        last_name: params.lastName?.trim() || null,
        company_name: params.companyName?.trim() || null,
        contact_person: params.contactPerson?.trim() || null,
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        address: params.address?.trim() || null,
        notes: params.notes?.trim() || null,
        source: params.source?.trim() || null,
      } as Partial<CreateCustomerParams>;
    },
    // Duplicate checks before update (throws ConflictError)
    beforeUpdate: async (existing, params, ctx) => {
      const existingRecord = existing as Record<string, unknown>;

      // Check for duplicate phone if changing
      if (
        params.phone !== undefined &&
        params.phone?.trim() !== existingRecord.phone
      ) {
        const { data: phoneDup } = await withDbCapture(
          "beforeUpdate:phoneDup",
          ctx.db
            .from("customers")
            .select("id")
            .eq("organization_id", ctx.orgId)
            .eq("phone", params.phone?.trim() ?? "")
            .is("deleted_at", null)
            .neq("id", existingRecord.id as string)
            .maybeSingle(),
        );
        if (phoneDup) {
          throw new ConflictError(
            "A customer with this phone number already exists",
            {
              existingCustomerId: phoneDup.id,
            },
          );
        }
      }

      // Check for duplicate email if changing
      if (
        params.email !== undefined &&
        params.email?.trim() !== existingRecord.email
      ) {
        const { data: emailDup } = await withDbCapture(
          "beforeUpdate:emailDup",
          ctx.db
            .from("customers")
            .select("id")
            .eq("organization_id", ctx.orgId)
            .eq("email", params.email?.trim() ?? "")
            .is("deleted_at", null)
            .neq("id", existingRecord.id as string)
            .maybeSingle(),
        );
        if (emailDup) {
          throw new ConflictError("A customer with this email already exists", {
            existingCustomerId: emailDup.id,
          });
        }
      }

      return {};
    },
  },
});

/**
 * Lists all customers for an organization with optional search.
 * Uses the factory's getAll with onQuery hook for search, plus vehicle count enrichment.
 */
export async function getCustomers(
  db: SupabaseClient,
  orgId: string,
  options?: {
    search?: string;
    page?: number;
    pageSize?: number;
    branchId?: string;
  },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  const result = await crud.getAll(db, orgId, {
    page: options?.page,
    pageSize: options?.pageSize,
    branchId: options?.branchId ?? undefined,
    search: options?.search,
  });

  // Batch fetch vehicle counts for all customers
  const customerIds = result.data.map((c) => c.id);
  let vehicleCounts = new Map<string, number>();

  if (customerIds.length > 0) {
    const { data: counts, error: countsError } = await withDbCapture(
      "getCustomers:vehicleCounts",
      db
        .from("vehicle_owners")
        .select("customer_id", { count: "exact" })
        .in("customer_id", customerIds)
        .is("owned_until", null),
    );

    if (!countsError && counts) {
      const countMap = new Map<string, number>();
      for (const row of counts) {
        const cid = row.customer_id as string;
        countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
      }
      vehicleCounts = countMap;
    }
  }

  return {
    ...result,
    data: result.data.map((customer) => ({
      ...customer,
      vehicle_count: vehicleCounts.get(customer.id) ?? 0,
    })),
  };
}

/**
 * Fast customer list using the get_customers_with_value RPC function.
 * Single DB call replaces customer list + vehicle count enrichment for simple list views.
 */
export async function getCustomersFast(
  db: SupabaseClient,
  orgId: string,
  options?: { search?: string; limit?: number },
): Promise<CustomerWithVehicleCount[]> {
  const { data, error } = await withDbCapture(
    "getCustomersFast",
    db.rpc("get_customers_with_value", {
      p_org_id: orgId,
      p_search: options?.search ?? null,
      p_limit: options?.limit ?? 50,
      p_offset: 0,
    }),
  );

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    company_name: string | null;
    created_at: string;
    last_visit_at: string | null;
    total_visits: number | null;
    total_spent: number | null;
    vehicles_count: number | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    organization_id: orgId,
    branch_id: null,
    first_name: row.first_name,
    last_name: row.last_name,
    full_name:
      row.full_name ??
      [row.first_name, row.last_name].filter(Boolean).join(" ") ??
      null,
    phone: row.phone,
    email: row.email,
    type: row.company_name ? "company" : "individual",
    company_name: row.company_name,
    contact_person: null,
    total_visits: row.total_visits ?? 0,
    last_visit_at: row.last_visit_at,
    source: null,
    tags: [],
    created_at: row.created_at,
    updated_at: row.last_visit_at ?? row.created_at,
    vehicle_count: row.vehicles_count ?? 0,
  })) as unknown as CustomerWithVehicleCount[];
}

/**
 * Lists customers from other organizations that have sharing enabled.
 * These are read-only — the current org can view but not modify them.
 */
export async function getSharedCustomers(
  db: SupabaseClient,
  orgId: string,
  options?: { search?: string; page?: number; pageSize?: number },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  const supabase = db;
  const search = options?.search;
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("customers")
    .select(
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, total_visits, last_visit_at, source, tags, created_at, updated_at",
      { count: "exact" },
    )
    .neq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // RLS handles the sharing_enabled check — we just filter out own org
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},full_name.ilike.${term},company_name.ilike.${term},contact_person.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
    );
  }

  const {
    data: customers,
    count: total,
    error,
  } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  // Batch fetch vehicle counts and org names in parallel
  const customerIds = (customers ?? []).map((c) => c.id);
  const orgIds = [...new Set((customers ?? []).map((c) => c.organization_id))];

  const [countResult, orgResult] = await Promise.all([
    customerIds.length > 0
      ? withDbCapture(
          "getSharedCustomers:vehicleCounts",
          supabase
            .from("vehicle_owners")
            .select("customer_id", { count: "exact" })
            .in("customer_id", customerIds)
            .is("owned_until", null),
        )
      : Promise.resolve({ data: null }),
    orgIds.length > 0
      ? withDbCapture(
          "getSharedCustomers:orgNames",
          supabase.from("organizations").select("id, name").in("id", orgIds),
        )
      : Promise.resolve({ data: null }),
  ]);

  // Build vehicle count map
  const vehicleCounts = new Map<string, number>();
  if (countResult.data) {
    for (const row of countResult.data) {
      const cid = row.customer_id as string;
      vehicleCounts.set(cid, (vehicleCounts.get(cid) ?? 0) + 1);
    }
  }

  // Build org name map
  const orgNames = new Map<string, string>();
  if (orgResult.data) {
    for (const org of orgResult.data) {
      orgNames.set(org.id, org.name);
    }
  }

  const data = (customers ?? []).map((customer) => ({
    ...customer,
    vehicle_count: vehicleCounts.get(customer.id) ?? 0,
    organization_name: orgNames.get(customer.organization_id) ?? "Unknown",
  }));

  return {
    data,
    total: total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((total ?? 0) / pageSize),
  } as unknown as PaginatedResponse<CustomerWithVehicleCount>;
}

/**
 * Returns a single customer by ID.
 */
export async function getCustomer(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<Customer> {
  return crud.getById(db, orgId, id);
}

/**
 * Returns a single customer from a sharing-enabled org (read-only).
 * Used by the shared customer detail drawer.
 */
export async function getSharedCustomer(
  db: SupabaseClient,
  id: string,
  viewerOrgId: string,
): Promise<Customer> {
  const supabase = db;
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, created_at, updated_at, organizations!inner(id, sharing_enabled, name)",
    )
    .eq("id", id)
    .neq("organization_id", viewerOrgId)
    .eq("organizations.sharing_enabled", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError("Customer not found");
  }

  const orgRow = data as unknown as { organizations?: { name?: string } };
  const orgName = orgRow.organizations?.name ?? "Unknown";
  return { ...data, organization_name: orgName } as unknown as Customer;
}

/**
 * Returns vehicles for a shared customer (read-only).
 */
export async function getSharedCustomerVehicles(
  db: SupabaseClient,
  customerId: string,
  viewerOrgId: string,
): Promise<
  {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
  }[]
> {
  const supabase = db;
  const { data, error } = await withDbCapture(
    "getSharedCustomerVehicles",
    supabase
      .from("vehicles")
      .select("id, plate_number, make, model, year")
      .eq("customer_id", customerId)
      .neq("organization_id", viewerOrgId)
      .is("deleted_at", null),
  );
  if (error) return [];

  return data ?? [];
}

/**
 * Creates a new customer with audit log.
 * Uses factory with beforeCreate hook for validation and duplicate warnings.
 */
export async function createCustomer(
  db: SupabaseClient,
  orgId: string,
  params: CreateCustomerParams,
  userId: string,
): Promise<Customer> {
  return crud.create(db, orgId, params, userId);
}

/**
 * Updates a customer with audit log.
 * Uses factory with beforeUpdate hook for duplicate checks and fieldMap for PATCH.
 */
export async function updateCustomer(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateCustomerParams,
  userId: string,
): Promise<Customer> {
  return crud.update(db, orgId, id, params, userId);
}

/**
 * Soft-deletes a customer.
 */
export async function deleteCustomer(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId: string,
): Promise<void> {
  await crud.softDelete(db, orgId, id, userId);
}

/**
 * Searches customers by name, phone, or email.
 */
export async function searchCustomers(
  db: SupabaseClient,
  orgId: string,
  query: string,
  options?: { page?: number; pageSize?: number; branchId?: string },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  return getCustomers(db, orgId, { search: query, ...options });
}
