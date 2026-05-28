import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import type { Customer } from "@/lib/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateCustomerParams,
  CustomerWithVehicleCount,
  PaginatedResponse,
  UpdateCustomerParams,
} from "@/lib/types";

/**
 * Lists all customers for an organization with optional search.
 */
export async function getCustomers(
  orgId: string,
  options?: { search?: string; page?: number; pageSize?: number },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  const supabase = await createClient();

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
  orgId: string,
  options?: { search?: string; page?: number; pageSize?: number },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  const supabase = await createClient();

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
  id: string,
  orgId: string,
): Promise<Customer> {
  const supabase = await createClient();

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
  id: string,
  viewerOrgId: string,
): Promise<Customer> {
  const supabase = await createClient();

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
  const supabase = await createClient();

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

  const supabase = await createClient();

  // Check for duplicate phone if provided
  if (params.phone?.trim()) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", params.phone.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      throw new ConflictError(
        "A customer with this phone number already exists",
        { existingCustomerId: existing.id },
      );
    }
  }

  // Check for duplicate email if provided
  if (params.email?.trim()) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", params.email.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      throw new ConflictError("A customer with this email already exists", {
        existingCustomerId: existing.id,
      });
    }
  }

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
  id: string,
  orgId: string,
  params: UpdateCustomerParams,
  userId: string,
): Promise<Customer> {
  const supabase = await createClient();

  // Get existing customer
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

  const updates: Record<string, unknown> = {};
  if (params.type !== undefined) updates.type = params.type;
  if (params.firstName !== undefined)
    updates.first_name = params.firstName?.trim() || null;
  if (params.lastName !== undefined)
    updates.last_name = params.lastName?.trim() || null;
  if (params.companyName !== undefined)
    updates.company_name = params.companyName?.trim() || null;
  if (params.contactPerson !== undefined)
    updates.contact_person = params.contactPerson?.trim() || null;
  if (params.phone !== undefined) updates.phone = params.phone?.trim() || null;
  if (params.email !== undefined) updates.email = params.email?.trim() || null;
  if (params.address !== undefined)
    updates.address = params.address?.trim() || null;
  if (params.notes !== undefined) updates.notes = params.notes?.trim() || null;
  if (params.source !== undefined)
    updates.source = params.source?.trim() || null;
  updates.updated_by = userId;

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
  id: string,
  orgId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

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
  orgId: string,
  query: string,
  options?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<CustomerWithVehicleCount>> {
  return getCustomers(orgId, { search: query, ...options });
}
