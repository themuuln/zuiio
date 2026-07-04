"use server";

import { ValidationError } from "@/lib/errors";
import { lookupPlate } from "@/lib/smartcar/browser";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { withDbCapture } from "@/lib/supabase/query";
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
  return data as string;
}

async function withOrgClient() {
  const supabase = await createClient();
  const orgId = await getOrgId();
  return { supabase, orgId };
}

/** Wraps a supabase query promise with withDbCapture, casting only the promise type so
 *  TypeScript's inference doesn't get stuck on the complex PostgrestBuilder types. */
function tracked<T>(
  label: string,
  promise: PromiseLike<{ data: T; error: unknown }>,
): Promise<{ data: T; error: unknown }> {
  return withDbCapture(label, promise as PromiseLike<{ data: T; error: unknown }>);
}

// ── Find or Create Customer ─────────────────────────────────────

export async function findCustomerByPhone(phone: string) {
  const { supabase, orgId } = await withOrgClient();
  const { data, error } = await tracked<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null>(
    "findCustomerByPhone",
    supabase
      .from("customers")
      .select("id, first_name, last_name, phone")
      .eq("organization_id", orgId)
      .eq("phone", phone)
      .is("deleted_at", null)
      .maybeSingle(),
  );

  if (error) return null;

  return data;
}

export async function findCustomerByPlate(plate: string) {
  const { supabase, orgId } = await withOrgClient();

  const { data, error } = await tracked<Record<string, unknown> | null>(
    "findCustomerByPlate",
    supabase
      .from("vehicles")
      .select(
        "id, plate_number, make, model, year, color, owners:vehicle_owners!inner(customer_id, customers!inner(id, first_name, last_name, phone)))",
      )
      .eq("organization_id", orgId)
      .eq("plate_number", plate)
      .is("deleted_at", null)
      .is("vehicle_owners.owned_until", null)
      .maybeSingle(),
  );

  if (error) return null;

  return data;
}

// ── Lookup vehicle by plate (returns vehicle + customer + service history) ──

export interface VehicleLookupResult {
  exists: boolean;
  /** True when the plate was not found in DB but was found via SmartCar.mn API. */
  smartcarFound?: boolean;
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

type VehicleRow = NonNullable<VehicleLookupResult["vehicle"]>;

interface OwnerRow {
  customer_id: string;
  customers: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
}

interface WorkOrderRow {
  id: string;
  status: string;
  created_at: string;
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  total: number;
  mechanic_id: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

interface ServiceRow {
  work_order_id: string;
  service_name: string;
  final_price: number;
}

export async function lookupVehicleByPlate(
  plate: string,
): Promise<VehicleLookupResult> {
  const { supabase, orgId } = await withOrgClient();

  // Find vehicle
  const { data: vehicle, error: vehicleError } = await tracked<VehicleRow | null>(
    "lookupVehicleByPlate:vehicle",
    supabase
      .from("vehicles")
      .select(
        "id, plate_number, make, model, year, color, vin, engine, transmission, fuel_type, odometer",
      )
      .eq("organization_id", orgId)
      .eq("plate_number", plate)
      .is("deleted_at", null)
      .maybeSingle(),
  );

  if (vehicleError) {
    return {
      exists: false,
      vehicle: null,
      customer: null,
      serviceHistory: [],
    };
  }

  if (!vehicle) {
    // Try SmartCar.mn API to auto-fill vehicle data
    try {
      const smartcarResult = await lookupPlate(plate);
      if (smartcarResult.ok) {
        const sc = smartcarResult.data;
        return {
          exists: false,
          smartcarFound: true,
          vehicle: {
            id: "",
            plate_number: sc.plateNumber,
            make: sc.make,
            model: sc.model,
            year: sc.year,
            color: sc.color || null,
            vin: sc.vin || null,
            engine: sc.engineCc?.toString() || null,
            transmission: sc.transmission || null,
            fuel_type: sc.fuelType || null,
            odometer: null,
          },
          customer: null,
          serviceHistory: [],
        };
      }
    } catch {
      // SmartCar lookup failure is non-fatal — just return empty
    }

    return {
      exists: false,
      vehicle: null,
      customer: null,
      serviceHistory: [],
    };
  }

  // Get primary owner
  const { data: owner } = await tracked<OwnerRow | null>(
    "lookupVehicleByPlate:owner",
    supabase
      .from("vehicle_owners")
      .select("customer_id, customers!inner(id, first_name, last_name, phone)")
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicle.id)
      .is("owned_until", null)
      .maybeSingle(),
  );

  const customer = owner
    ? {
        id: owner.customers.id,
        first_name: owner.customers.first_name,
        last_name: owner.customers.last_name,
        phone: owner.customers.phone,
      }
    : null;

  // Get work orders with services
  const { data: workOrders } = await tracked<WorkOrderRow[] | null>(
    "lookupVehicleByPlate:workOrders",
    supabase
      .from("work_orders")
      .select(`
        id, status, created_at, complaint, diagnosis, notes, total, mechanic_id
      `)
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicle.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  );

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
    tracked<ProfileRow[] | null>(
      "lookupVehicleByPlate:profiles",
      supabase.from("profiles").select("id, full_name").in("id", mechanicIds),
    ),
    tracked<ServiceRow[] | null>(
      "lookupVehicleByPlate:services",
      supabase
        .from("work_order_services")
        .select("work_order_id, service_name, final_price")
        .in("work_order_id", woIds),
    ),
  ]);

  const mechanicNameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const servicesByWo = new Map<string, { name: string; price: number }[]>();
  for (const s of allServices ?? []) {
    if (!servicesByWo.has(s.work_order_id))
      servicesByWo.set(s.work_order_id, []);
    servicesByWo
      .get(s.work_order_id)
      ?.push({ name: s.service_name, price: Number(s.final_price) });
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

  const { supabase, orgId } = await withOrgClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new ValidationError("Not authenticated");

  // Find or create customer
  let customerId: string | null = null;

  if (params.customerPhone?.trim()) {
    const existing = await findCustomerByPhone(params.customerPhone.trim());
    if (existing) {
      customerId = existing.id;
    } else if (params.customerFirstName?.trim()) {
      const newCust = await createCustomer(
        supabase,
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
  const { data: existingVehicle } = await tracked<{ id: string } | null>(
    "quickRegisterVehicle:existingVehicle",
    supabase
      .from("vehicles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("plate_number", trimmedPlate)
      .is("deleted_at", null)
      .maybeSingle(),
  );

  let vehicle;
  if (existingVehicle) {
    // UPDATE existing vehicle
    vehicle = await updateVehicle(
      supabase,
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
      supabase,
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
  const { supabase, orgId } = await withOrgClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, is_active")
    .eq("organization_id", orgId)
    .order("full_name");

  if (search?.trim()) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }

  const { data } = await withDbCapture("searchMechanics", query);
  return data ?? [];
}

// ── Search Vehicles (for autocomplete) ──────────────────────────

export async function searchVehicles(search?: string) {
  const { supabase, orgId } = await withOrgClient();

  let query = supabase
    .from("vehicles")
    .select("id, plate_number, make, model, year, color")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("plate_number")
    .limit(20);

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `plate_number.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%`,
    );
  }

  const { data } = await withDbCapture("searchVehicles", query);
  return data ?? [];
}

// ── Search Vehicles with Customers (for assign dialog) ─────────

export async function searchVehiclesWithCustomers(search?: string) {
  const { supabase, orgId } = await withOrgClient();

  let query = supabase
    .from("vehicles")
    .select(`
      id, plate_number, make, model, year, color,
      vehicle_owners(
        owned_until,
        customers(id, first_name, last_name, phone)
      )
    `)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("plate_number")
    .limit(20);

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `plate_number.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%`,
    );
  }

  const { data } = await tracked<Record<string, unknown>[] | null>(
    "searchVehiclesWithCustomers",
    query,
  );

  // Flatten the nested structure
  return (data ?? []).map((v: Record<string, unknown>) => {
    // Shape is guaranteed by the Supabase select clause in the query above
    const record = v as unknown as {
      id: string;
      plate_number: string;
      make: string;
      model: string;
      year: number | null;
      color: string | null;
      vehicle_owners?: Array<{
        owned_until: string | null;
        customers: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
        } | null;
      }> | null;
    };
    const owner = record.vehicle_owners?.[0]?.customers;
    return {
      id: record.id,
      plate_number: record.plate_number,
      make: record.make,
      model: record.model,
      year: record.year,
      color: record.color,
      customer: owner
        ? {
            id: owner.id,
            first_name: owner.first_name,
            last_name: owner.last_name,
            phone: owner.phone,
          }
        : null,
    };
  });
}

// ── Register Mechanic (create profile / update role) ────────────

export async function registerMechanic(params: {
  email: string;
  fullName: string;
  phone?: string;
}) {
  if (!params.email?.trim()) throw new ValidationError("Email is required");
  if (!params.fullName?.trim()) throw new ValidationError("Name is required");

  const { supabase, orgId } = await withOrgClient();
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
  const { supabase, orgId } = await withOrgClient();

  const { data: workOrders, error: workOrdersError } = await tracked<WorkOrderRow[] | null>(
    "getVehicleServiceTimeline:workOrders",
    supabase
      .from("work_orders")
      .select(
        "id, status, created_at, complaint, diagnosis, notes, total, mechanic_id",
      )
      .eq("organization_id", orgId)
      .eq("vehicle_id", vehicleId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  );

  if (workOrdersError) return [];

  const mechanicIds = [
    ...new Set(
      (workOrders ?? []).flatMap((wo) =>
        wo.mechanic_id ? [wo.mechanic_id] : [],
      ),
    ),
  ] as string[];
  const woIds = (workOrders ?? []).map((wo) => wo.id);
  const [{ data: profiles }, { data: allServices }] = await Promise.all([
    tracked<ProfileRow[] | null>(
      "getVehicleServiceTimeline:profiles",
      supabase.from("profiles").select("id, full_name").in("id", mechanicIds),
    ),
    tracked<ServiceRow[] | null>(
      "getVehicleServiceTimeline:services",
      supabase
        .from("work_order_services")
        .select("work_order_id, service_name, final_price")
        .in("work_order_id", woIds),
    ),
  ]);

  const mechanicNameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const servicesByWo = new Map<string, { name: string; price: number }[]>();
  for (const s of allServices ?? []) {
    if (!servicesByWo.has(s.work_order_id))
      servicesByWo.set(s.work_order_id, []);
    servicesByWo
      .get(s.work_order_id)
      ?.push({ name: s.service_name, price: Number(s.final_price) });
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
  customerId?: string;
  complaint?: string;
  branchId?: string;
}): Promise<{ workOrderId: string }> {
  const { supabase, orgId } = await withOrgClient();

  if (!params.vehicleId) throw new ValidationError("Vehicle is required");

  // Resolve branch: if not provided, fall back to the main branch
  let branchId = params.branchId;
  if (!branchId) {
    const { data: mainBranch } = await tracked<{ id: string } | null>(
      "addVehicleToQueue:mainBranch",
      supabase
        .from("branches")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_main", true)
        .maybeSingle(),
    );
    if (mainBranch) branchId = mainBranch.id;
  }
  if (!branchId) {
    throw new ValidationError(
      "A branch is required to add a vehicle to the queue.",
    );
  }

  // Check for duplicate active work order on this vehicle
  const { data: activeWO } = await tracked<{ id: string; status: string; bay_number: string | null } | null>(
    "addVehicleToQueue:activeWO",
    supabase
      .from("work_orders")
      .select("id, status, bay_number")
      .eq("organization_id", orgId)
      .eq("vehicle_id", params.vehicleId)
      .is("deleted_at", null)
      .not("status", "in", '("Completed","Cancelled")')
      .maybeSingle(),
  );

  if (activeWO) {
    const location = activeWO.bay_number
      ? `already assigned to Bay #${activeWO.bay_number}`
      : "already in the waiting queue";
    throw new ValidationError(`This vehicle is ${location}.`);
  }

  const result = await createWorkOrder(supabase, orgId, {
    customer_id: params.customerId,
    vehicle_id: params.vehicleId,
    branchId,
    complaint: params.complaint?.trim() || undefined,
  });

  return { workOrderId: result.id };
}
