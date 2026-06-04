import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateCustomerParams,
  Customer,
  CustomerWithVehicleCount,
  PaginatedResponse,
  UpdateCustomerParams,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

/**
 * Lists all customers for an organization with optional search.
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
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},full_name.ilike.${term},company_name.ilike.${term},contact_person.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
    );
  }
  if (options?.branchId) query = withBranchFilter(query, options.branchId);

  const {
    data: customers,
    count: total,
    error,
  } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  // Batch fetch vehicle counts for all customers
  const customerIds = (customers ?? []).map((c) => c.id);
  let vehicleCounts = new Map<string, number>();

  if (customerIds.length > 0) {
    const { data: counts } = await supabase
      .from("vehicle_owners")
      .select("customer_id", { count: "exact" })
      .in("customer_id", customerIds)
      .is("owned_until", null);

    if (counts) {
      const countMap = new Map<string, number>();
      for (const row of counts) {
        const cid = row.customer_id as string;
        countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
      }
      vehicleCounts = countMap;
    }
  }

  const data = (customers ?? []).map((customer) => ({
    ...customer,
    vehicle_count: vehicleCounts.get(customer.id) ?? 0,
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

  // Batch fetch vehicle counts
  const customerIds = (customers ?? []).map((c) => c.id);
  let vehicleCounts = new Map<string, number>();

  if (customerIds.length > 0) {
    const { data: counts } = await supabase
      .from("vehicle_owners")
      .select("customer_id", { count: "exact" })
      .in("customer_id", customerIds)
      .is("owned_until", null);

    if (counts) {
      const countMap = new Map<string, number>();
      for (const row of counts) {
        const cid = row.customer_id as string;
        countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
      }
      vehicleCounts = countMap;
    }
  }

  // Fetch org names for attribution badges
  const orgIds = [...new Set((customers ?? []).map((c) => c.organization_id))];
  const orgNames = new Map<string, string>();

  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    if (orgs) {
      for (const org of orgs) {
        orgNames.set(org.id, org.name);
      }
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
  const supabase = db;
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, portal_token, customer_user_id, created_at, updated_at, created_by, updated_by",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError("Customer not found");
  }

  return data as unknown as Customer;
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
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, created_at, updated_at",
    )
    .eq("id", id)
    .neq("organization_id", viewerOrgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError("Customer not found");
  }

  // Verify the owning org has sharing enabled
  const { data: ownerOrg } = await supabase
    .from("organizations")
    .select("id, sharing_enabled, name")
    .eq("id", data.organization_id)
    .single();

  if (!ownerOrg?.sharing_enabled) {
    throw new NotFoundError("Customer not found");
  }

  return { ...data, organization_name: ownerOrg.name } as unknown as Customer;
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
  const { data } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, year")
    .eq("customer_id", customerId)
    .neq("organization_id", viewerOrgId)
    .is("deleted_at", null);

  return data ?? [];
}

/**
 * Creates a new customer with audit log.
 */
export async function createCustomer(
  db: SupabaseClient,
  orgId: string,
  params: CreateCustomerParams,
  userId: string,
): Promise<Customer> {
  if (
    !params.phone?.trim() &&
    !params.email?.trim() &&
    !params.firstName?.trim() &&
    !params.companyName?.trim() &&
    !params.contactPerson?.trim()
  ) {
    throw new ValidationError("At least one identifying field is required");
  }

  const supabase = db;

  // Check for duplicate phone if provided (warn only — don't block)
  if (params.phone?.trim()) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id, first_name, last_name, company_name, phone")
      .eq("organization_id", orgId)
      .eq("phone", params.phone.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const existingName =
        [existing.first_name, existing.last_name].filter(Boolean).join(" ") ||
        existing.company_name ||
        existing.phone;
      console.warn(
        `[duplicate] Phone ${params.phone.trim()} already belongs to "${existingName}" (${existing.id})`,
      );
    }
  }

  // Check for duplicate email if provided (warn only — don't block)
  if (params.email?.trim()) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id, first_name, last_name, company_name, email")
      .eq("organization_id", orgId)
      .eq("email", params.email.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const existingName =
        [existing.first_name, existing.last_name].filter(Boolean).join(" ") ||
        existing.company_name ||
        existing.email;
      console.warn(
        `[duplicate] Email ${params.email.trim()} already belongs to "${existingName}" (${existing.id})`,
      );
    }
  }

  const resolvedBranchId = await resolveBranchId(
    supabase,
    orgId,
    params.branchId,
    { strict: false },
  );

  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: orgId,
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
      branch_id: resolvedBranchId,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, type, first_name, last_name, full_name, company_name, contact_person, phone, email, address, notes, source, tags, total_visits, last_visit_at, created_at, updated_at, created_by, updated_by",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create customer");
  }

  // Audit log
  await createAuditLog({
    supabase,
    action: "create",
    table_name: "customers",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customers(orgId), "max");

  return data as unknown as Customer;
}

/**
 * Updates a customer with audit log.
 */
export async function updateCustomer(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateCustomerParams,
  userId: string,
): Promise<Customer> {
  const supabase = db; // Get existing customer
  const { data: existing, error: fetchError } = await supabase
    .from("customers")
    .select(
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, portal_token, customer_user_id, created_at, updated_at, created_by, updated_by",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Customer not found");
  }

  // Check for duplicate phone if changing
  if (params.phone !== undefined && params.phone?.trim() !== existing.phone) {
    const { data: phoneDup } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", params.phone?.trim() ?? "")
      .is("deleted_at", null)
      .neq("id", id)
      .maybeSingle();

    if (phoneDup) {
      throw new ConflictError(
        "A customer with this phone number already exists",
        { existingCustomerId: phoneDup.id },
      );
    }
  }

  // Check for duplicate email if changing
  if (params.email !== undefined && params.email?.trim() !== existing.email) {
    const { data: emailDup } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", params.email?.trim() ?? "")
      .is("deleted_at", null)
      .neq("id", id)
      .maybeSingle();

    if (emailDup) {
      throw new ConflictError("A customer with this email already exists", {
        existingCustomerId: emailDup.id,
      });
    }
  }

  const customerFieldMap: FieldMap<UpdateCustomerParams> = {
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
  };
  const updates = {
    ...buildUpdates(params, customerFieldMap),
    updated_by: userId,
  };

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, branch_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, portal_token, customer_user_id, created_at, updated_at, created_by, updated_by",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update customer");
  }

  // Audit log
  await createAuditLog({
    supabase,
    action: "update",
    table_name: "customers",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existing as unknown as unknown as Record<string, unknown>,
    new_data: data as unknown as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customers(orgId), "max");

  return data as unknown as Customer;
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
  const supabase = db;
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    throw new NotFoundError("Customer not found");
  }

  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase,
    action: "soft_delete",
    table_name: "customers",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.customers(orgId), "max");
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
