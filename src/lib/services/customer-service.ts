import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { Customer } from "@/lib/database.types";
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
  search?: string,
): Promise<CustomerWithVehicleCount[]> {
  const supabase = await createClient();

  return withCache(
    ["getCustomers", orgId, search ?? ""],
    async () => {
      let query = supabase
        .from("customers")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (search?.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `first_name.ilike.${term},last_name.ilike.${term},full_name.ilike.${term},company_name.ilike.${term},contact_person.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
        );
      }

      const { data: customers, error } = await query;

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

        // Calculate count per customer_id from the batched results
        if (counts) {
          const countMap = new Map<string, number>();
          for (const row of counts) {
            const cid = row.customer_id as string;
            countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
          }
          vehicleCounts = countMap;
        }
      }

      return (customers ?? []).map((customer) => ({
        ...customer,
        vehicle_count: vehicleCounts.get(customer.id) ?? 0,
      }));
    },
    {
      tags: [cacheTags.customers(orgId)],
      revalidate: cacheDurations.customers,
    },
  );
}

/**
 * Returns a single customer by ID.
 */
export async function getCustomer(
  id: string,
  orgId: string,
): Promise<Customer> {
  const supabase = await createClient();

  return withCache(
    ["getCustomer", id],
    async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        throw new NotFoundError("Customer not found");
      }

      return data;
    },
    {
      tags: [cacheTags.customers(orgId)],
      revalidate: cacheDurations.customers,
    },
  );
}

/**
 * Creates a new customer with audit log.
 */
export async function createCustomer(
  orgId: string,
  params: CreateCustomerParams,
  userId: string,
): Promise<Customer> {
  const supabase = await createClient();

  if (
    !params.phone?.trim() &&
    !params.email?.trim() &&
    !params.firstName?.trim() &&
    !params.companyName?.trim() &&
    !params.contactPerson?.trim()
  ) {
    throw new ValidationError("At least one identifying field is required");
  }

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
      );
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
    .select("*")
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
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customers(orgId), "max");

  return data;
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
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Customer not found");
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
  if (params.source !== undefined) updates.source = params.source?.trim() || null;
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
    .select("*")
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
    old_data: existing as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.customers(orgId), "max");

  return data;
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
): Promise<CustomerWithVehicleCount[]> {
  return getCustomers(orgId, query);
}
