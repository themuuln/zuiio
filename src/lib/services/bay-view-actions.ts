"use server";

import { ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createCustomer } from "./customer-service";
import { createVehicle, updateVehicle } from "./vehicle-service";
import { createWorkOrder } from "./work-order-service";

// ── Helper ──────────────────────────────────────────────────────

async function getOrgId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("get_user_organization_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No organization selected");
  return data;
}

// ── Find or Create Customer ─────────────────────────────────────

export async function findCustomerByPhone(phone: string) {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { data } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("organization_id", orgId)
    .eq("phone", phone)
    .is("deleted_at", null)
    .maybeSingle();

  return data;
}

export async function findCustomerByPlate(plate: string) {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, plate_number, make, model, year, color, owners:vehicle_owners!inner(customer_id, customers!inner(id, first_name, last_name, phone)))",
    )
    .eq("organization_id", orgId)
    .eq("plate_number", plate)
    .is("deleted_at", null)
    .is("vehicle_owners.owned_until", null)
    .maybeSingle();

  return data;
}

// ── Lookup vehicle by plate (returns vehicle + customer + service history) ──

export interface VehicleLookupResult {
  exists: boolean;
  vehicle: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    vin: string | null;
    engine: string | null;
    transmission: string | null;
    fuel_type: string | null;
    odometer: number | null;
  } | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  serviceHistory: {
    work_order_id: string;
    status: string;
    created_at: string;
    complaint: string | null;
    diagnosis: string | null;
    notes: string | null;
    total: number;
    mechanic_name: string | null;
    services: { name: string; price: number }[];
  }[];
}

export async function lookupVehicleByPlate(
  plate: string,
): Promise<VehicleLookupResult> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Find vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(
      "id, plate_number, make, model, year, color, vin, engine, transmission, fuel_type, odometer",
    )
    .eq("organization_id", orgId)
    .eq("plate_number", plate)
    .is("deleted_at", null)
    .maybeSingle();

  if (!vehicle) {
    return {
      exists: false,
      vehicle: null,
      customer: null,
      serviceHistory: [],
    };
  }

  // Get primary owner
  const { data: owner } = await supabase
    .from("vehicle_owners")
    .select("customer_id, customers!inner(id, first_name, last_name, phone)")
    .eq("organization_id", orgId)
    .eq("vehicle_id", vehicle.id)
    .is("owned_until", null)
    .maybeSingle();

  const customer = owner
    ? {
        id: (
          owner.customers as unknown as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
          }
        ).id,
        first_name: (
          owner.customers as unknown as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
          }
        ).first_name,
        last_name: (
          owner.customers as unknown as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
          }
        ).last_name,
        phone: (
          owner.customers as unknown as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
          }
        ).phone,
      }
    : null;

  // Get work orders with services
  const { data: workOrders } = await supabase
    .from("work_orders")
    .select(`
      id, status, created_at, complaint, diagnosis, notes, total, mechanic_id
    `)
    .eq("organization_id", orgId)
    .eq("vehicle_id", vehicle.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch mechanic names and services for each WO (parallel)
  const mechanicIds = [
    ...new Set(
      (workOrders ?? []).flatMap((wo) =>
        wo.mechanic_id ? [wo.mechanic_id] : [],
      ),
    ),
  ] as string[];
  const woIds = (workOrders ?? []).map((wo) => wo.id);
  const [{ data: profiles }, { data: allServices }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", mechanicIds),
    supabase
      .from("work_order_services")
      .select("work_order_id, service_name, final_price")
      .in("work_order_id", woIds),
  ]);

  const mechanicNameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const servicesByWo = new Map<string, { name: string; price: number }[]>();
  for (const s of allServices ?? []) {
    if (!servicesByWo.has(s.work_order_id))
      servicesByWo.set(s.work_order_id, []);
    servicesByWo
      .get(s.work_order_id)!
      .push({ name: s.service_name, price: Number(s.final_price) });
  }

  const serviceHistory = (workOrders ?? []).map((wo) => ({
    work_order_id: wo.id,
    status: wo.status,
    created_at: wo.created_at,
    complaint: wo.complaint,
    diagnosis: wo.diagnosis,
    notes: wo.notes,
    total: Number(wo.total),
    mechanic_name: wo.mechanic_id
      ? (mechanicNameMap.get(wo.mechanic_id) ?? null)
      : null,
    services: servicesByWo.get(wo.id) ?? [],
  }));

  return {
    exists: true,
    vehicle: {
      id: vehicle.id,
      plate_number: vehicle.plate_number,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vin: vehicle.vin,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
      odometer: vehicle.odometer,
    },
    customer,
    serviceHistory,
  };
}

// ── Quick Registration: Find-or-Create Vehicle + Customer ─────

export async function quickRegisterVehicle(params: {
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
  engine?: string;
  odometer?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
}) {
  if (!params.plateNumber?.trim())
    throw new ValidationError("Plate number is required");
  if (!params.make?.trim()) throw new ValidationError("Make is required");
  if (!params.model?.trim()) throw new ValidationError("Model is required");

  const {
    data: { user: authUser },
  } = await (await createClient()).auth.getUser();
  if (!authUser) throw new Error("Not authenticated");

  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  // Find or create customer
  let customerId: string | null = null;

  if (params.customerPhone?.trim()) {
    const existing = await findCustomerByPhone(params.customerPhone.trim());
    if (existing) {
      customerId = existing.id;
    } else if (params.customerFirstName?.trim()) {
      const newCust = await createCustomer(
        orgId,
        {
          firstName: params.customerFirstName.trim(),
          lastName: params.customerLastName?.trim() || undefined,
          phone: params.customerPhone.trim(),
        },
        authUser.id,
      );
      customerId = newCust.id;
    }
  }

  // Check if vehicle already exists → update; else create
  const trimmedPlate = params.plateNumber.trim().toUpperCase();
  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("organization_id", orgId)
    .eq("plate_number", trimmedPlate)
    .is("deleted_at", null)
    .maybeSingle();

  let vehicle;
  if (existingVehicle) {
    // UPDATE existing vehicle
    vehicle = await updateVehicle(
      existingVehicle.id,
      orgId,
      {
        plateNumber: trimmedPlate,
        make: params.make.trim(),
        model: params.model.trim(),
        year: params.year ?? null,
        color: params.color?.trim() ?? null,
        vin: params.vin?.trim() ?? null,
        engine: params.engine?.trim() ?? null,
        odometer: params.odometer ?? null,
        customerId: customerId ?? undefined,
      },
      authUser.id,
    );
  } else {
    // CREATE new vehicle
    vehicle = await createVehicle(
      orgId,
      {
        plateNumber: trimmedPlate,
        make: params.make.trim(),
        model: params.model.trim(),
        year: params.year,
        color: params.color?.trim(),
        vin: params.vin?.trim(),
        engine: params.engine?.trim(),
        odometer: params.odometer,
        customerId: customerId ?? undefined,
      },
      authUser.id,
    );
  }

  return { vehicle, customerId, isUpdate: !!existingVehicle };
}

// ── Search mechanics (for registration) ─────────────────────────

export async function searchMechanics(search?: string) {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, is_active")
    .eq("organization_id", orgId)
    .order("full_name");

  if (search?.trim()) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }

  const { data } = await query;
  return data ?? [];
}

// ── Register Mechanic (create profile / update role) ────────────

export async function registerMechanic(params: {
  email: string;
  fullName: string;
  phone?: string;
}) {
  if (!params.email?.trim()) throw new ValidationError("Email is required");
  if (!params.fullName?.trim()) throw new ValidationError("Name is required");

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);
  const adminClient = await createServiceRoleClient();

  // Find existing auth user by email, or create one
  const {
    data: { users },
  } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = users?.find((u) => u.email === params.email.trim());

  let authUserId: string;
  if (existingAuthUser) {
    authUserId = existingAuthUser.id;
  } else {
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: params.email.trim(),
        email_confirm: true,
        user_metadata: { full_name: params.fullName.trim() },
      });
    if (createError)
      throw new Error(createError.message ?? "Failed to create auth user");
    if (!newUser?.user) throw new Error("Auth user creation returned no user");
    authUserId = newUser.user.id;
  }

  // Upsert profile with the correct UUID
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert({
      id: authUserId,
      organization_id: orgId,
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() ?? null,
      is_active: true,
    })
    .select("id, full_name, phone, is_active")
    .single();

  if (error) throw new Error(error.message ?? "Failed to register mechanic");

  return profile;
}

// ── Get service history for a vehicle (by plate) ────────────────

export async function getVehicleServiceTimeline(
  vehicleId: string,
): Promise<VehicleLookupResult["serviceHistory"]> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select(
      "id, status, created_at, complaint, diagnosis, notes, total, mechanic_id",
    )
    .eq("organization_id", orgId)
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const mechanicIds = [
    ...new Set(
      (workOrders ?? []).flatMap((wo) =>
        wo.mechanic_id ? [wo.mechanic_id] : [],
      ),
    ),
  ] as string[];
  const woIds = (workOrders ?? []).map((wo) => wo.id);
  const [{ data: profiles }, { data: allServices }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", mechanicIds),
    supabase
      .from("work_order_services")
      .select("work_order_id, service_name, final_price")
      .in("work_order_id", woIds),
  ]);

  const mechanicNameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const servicesByWo = new Map<string, { name: string; price: number }[]>();
  for (const s of allServices ?? []) {
    if (!servicesByWo.has(s.work_order_id))
      servicesByWo.set(s.work_order_id, []);
    servicesByWo
      .get(s.work_order_id)!
      .push({ name: s.service_name, price: Number(s.final_price) });
  }

  return (workOrders ?? []).map((wo) => ({
    work_order_id: wo.id,
    status: wo.status,
    created_at: wo.created_at,
    complaint: wo.complaint,
    diagnosis: wo.diagnosis,
    notes: wo.notes,
    total: Number(wo.total),
    mechanic_name: wo.mechanic_id
      ? (mechanicNameMap.get(wo.mechanic_id) ?? null)
      : null,
    services: servicesByWo.get(wo.id) ?? [],
  }));
}

// ── Add Vehicle to Waiting Queue ────────────────────────────────

export async function addVehicleToQueue(params: {
  vehicleId: string;
  customerId: string;
  complaint?: string;
}): Promise<{ workOrderId: string }> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [supabase, orgId] = await Promise.all([createClient(), getOrgId()]);

  if (!params.vehicleId) throw new ValidationError("Vehicle is required");
  if (!params.customerId) throw new ValidationError("Customer is required");

  // Check for duplicate active work order on this vehicle
  const { data: activeWO } = await supabase
    .from("work_orders")
    .select("id, status, bay_number")
    .eq("organization_id", orgId)
    .eq("vehicle_id", params.vehicleId)
    .is("deleted_at", null)
    .not("status", "in", '("Completed","Cancelled")')
    .maybeSingle();

  if (activeWO) {
    const location = activeWO.bay_number
      ? `already assigned to Bay #${activeWO.bay_number}`
      : "already in the waiting queue";
    throw new ValidationError(`This vehicle is ${location}.`);
  }

  const result = await createWorkOrder(orgId, {
    customer_id: params.customerId,
    vehicle_id: params.vehicleId,
    complaint: params.complaint?.trim() || undefined,
  });

  return { workOrderId: result.id };
}
