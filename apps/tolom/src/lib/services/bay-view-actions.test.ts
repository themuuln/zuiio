import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { withDbCapture } from "@/lib/supabase/query";
import { lookupPlate } from "@/lib/smartcar/browser";
import type { SmartCarLookupResult } from "@/lib/smartcar/browser";
import type { Customer } from "@/lib/types";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { reportServerError } from "@/lib/sentry-report-server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { createCustomer } from "./customer-service";
import { createVehicle, updateVehicle } from "./vehicle-service";
import { createWorkOrder } from "./work-order-service";

import {
  addVehicleToQueue,
  findCustomerByPhone,
  findCustomerByPlate,
  getVehicleServiceTimeline,
  lookupVehicleByPlate,
  quickRegisterVehicle,
  registerMechanic,
  searchMechanics,
  searchVehicles,
  searchVehiclesWithCustomers,
} from "./bay-view-actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn(
    (_label: string, promise: unknown) => promise,
  ),
}));
vi.mock("@/lib/smartcar/browser", () => ({ lookupPlate: vi.fn() }));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("./customer-service", () => ({ createCustomer: vi.fn() }));
vi.mock("./vehicle-service", () => ({
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));
vi.mock("./work-order-service", () => ({ createWorkOrder: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ORG_ID = "org-1";
const USER_ID = "test-user-id";

let mockClient: ReturnType<typeof createMockSupabaseClient>;

function setupMockClient() {
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  mockClient.rpc.mockResolvedValue({ data: ORG_ID, error: null });
  return mockClient;
}

/** Creates a mock service-role client with admin auth methods for registerMechanic tests. */
function createMockAdminClient() {
  const client = createMockSupabaseClient();
  return client as unknown as ReturnType<typeof createMockSupabaseClient> & {
    auth: {
      admin: {
        listUsers: ReturnType<typeof vi.fn>;
        createUser: ReturnType<typeof vi.fn>;
      };
    };
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMockClient();
});

// ─── findCustomerByPhone ──────────────────────────────────────

describe("findCustomerByPhone", () => {
  it("returns customer when found", async () => {
    const customer = {
      id: "cust-1",
      first_name: "John",
      last_name: "Doe",
      phone: "1234567890",
    };
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: customer,
      error: null,
    });

    const result = await findCustomerByPhone("1234567890");

    expect(result).toEqual(customer);
    expect(mockClient.from).toHaveBeenCalledWith("customers");
    expect(mockClient.rpc).toHaveBeenCalledWith(
      "get_user_organization_id",
    );
  });

  it("returns null when no customer matches", async () => {
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await findCustomerByPhone("unknown");

    expect(result).toBeNull();
  });

  it("returns null on DB error", async () => {
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await findCustomerByPhone("1234567890");

    expect(result).toBeNull();
  });
});

// ─── findCustomerByPlate ──────────────────────────────────────

describe("findCustomerByPlate", () => {
  it("returns vehicle with owner info when found", async () => {
    const vehicle = {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Blue",
      owners: {
        customer_id: "cust-1",
        customers: {
          id: "cust-1",
          first_name: "John",
          last_name: "Doe",
          phone: "1234567890",
        },
      },
    };
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: vehicle,
      error: null,
    });

    const result = await findCustomerByPlate("ABC123");

    expect(result).toEqual(vehicle);
    expect(mockClient.from).toHaveBeenCalledWith("vehicles");
  });

  it("returns null when plate not found", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await findCustomerByPlate("UNKNOWN");

    expect(result).toBeNull();
  });

  it("returns null on DB error", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await findCustomerByPlate("ABC123");

    expect(result).toBeNull();
  });
});

// ─── lookupVehicleByPlate ─────────────────────────────────────

describe("lookupVehicleByPlate", () => {
  const baseVehicle = {
    id: "v-1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "Blue",
    vin: "1HGBH41JXMN109186",
    engine: "2.0L",
    transmission: "Automatic",
    fuel_type: "Gasoline",
    odometer: 50000,
  };

  const baseOwner = {
    customer_id: "cust-1",
    customers: {
      id: "cust-1",
      first_name: "John",
      last_name: "Doe",
      phone: "1234567890",
    },
  };

  const baseWorkOrders = [
    {
      id: "wo-1",
      status: "completed",
      bay_number: 3,
      created_at: "2026-06-01T10:00:00Z",
      complaint: "Oil change",
      diagnosis: null,
      notes: null,
      total: 150,
      mechanic_id: "mech-1",
    },
  ];

  const baseProfiles = [{ id: "mech-1", full_name: "Mike Mechanic" }];

  const baseServices = [
    {
      work_order_id: "wo-1",
      service_name: "Oil Change",
      final_price: 150,
    },
  ];

  it("returns full vehicle lookup when found in DB", async () => {
    // 1. Vehicle query -> maybeSingle
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: baseVehicle,
      error: null,
    });
    // 2a. Owner query -> maybeSingle (parallel)
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: baseOwner,
      error: null,
    });
    // 2b. Work orders query -> limit() returns qb -> resolveOnce
    mockClient.__qb.resolveOnce({ data: baseWorkOrders, error: null });
    // 3a. Profiles query -> in() returns qb -> resolveOnce
    mockClient.__qb.resolveOnce({ data: baseProfiles, error: null });
    // 3b. Services query -> in() returns qb -> resolveOnce
    mockClient.__qb.resolveOnce({ data: baseServices, error: null });

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(true);
    expect(result.vehicle).toEqual({
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Blue",
      vin: "1HGBH41JXMN109186",
      engine: "2.0L",
      transmission: "Automatic",
      fuel_type: "Gasoline",
      odometer: 50000,
    });
    expect(result.customer).toEqual({
      id: "cust-1",
      first_name: "John",
      last_name: "Doe",
      phone: "1234567890",
    });
    expect(result.serviceHistory).toHaveLength(1);
    expect(result.serviceHistory[0]).toMatchObject({
      work_order_id: "wo-1",
      status: "completed",
      bay_number: 3,
      mechanic_name: "Mike Mechanic",
      services: [{ name: "Oil Change", price: 150 }],
    });
    expect(result.smartcarFound).toBeUndefined();
  });

  it("returns empty result when vehicle DB query errors", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(false);
    expect(result.vehicle).toBeNull();
    expect(result.customer).toBeNull();
    expect(result.serviceHistory).toEqual([]);
  });

  it("tries SmartCar when vehicle not found in DB and SmartCar succeeds", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(lookupPlate).mockResolvedValueOnce({
      ok: true,
      data: {
        plateNumber: "ABC123",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        color: "Blue",
        vin: "1HGBH41JXMN109186",
        engineCc: 2000,
        transmission: "Automatic",
        fuelType: "Gasoline",
      },
    } as unknown as SmartCarLookupResult);

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(false);
    expect(result.smartcarFound).toBe(true);
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe("Toyota");
    expect(result.vehicle!.engine).toBe("2000");
    expect(lookupPlate).toHaveBeenCalledWith("ABC123");
  });

  it("returns empty when not found in DB and SmartCar returns no match", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(lookupPlate).mockResolvedValueOnce({
      ok: false,
      data: null,
    } as unknown as SmartCarLookupResult);

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(false);
    expect(result.smartcarFound).toBeUndefined();
    expect(result.vehicle).toBeNull();
    expect(result.customer).toBeNull();
    expect(result.serviceHistory).toEqual([]);
  });

  it("returns empty when not found in DB and SmartCar throws", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(lookupPlate).mockRejectedValueOnce(
      new Error("SmartCar API error"),
    );

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(false);
    expect(result.vehicle).toBeNull();
    expect(reportServerError).toHaveBeenCalled();
  });

  it("handles vehicle with no owner gracefully", async () => {
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: baseVehicle,
      error: null,
    });
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: baseWorkOrders, error: null });
    mockClient.__qb.resolveOnce({ data: baseProfiles, error: null });
    mockClient.__qb.resolveOnce({ data: baseServices, error: null });

    const result = await lookupVehicleByPlate("ABC123");

    expect(result.exists).toBe(true);
    expect(result.customer).toBeNull();
    expect(result.serviceHistory).toHaveLength(1);
  });
});

// ─── quickRegisterVehicle ─────────────────────────────────────

describe("quickRegisterVehicle", () => {
  it("throws ValidationError when plate is missing", async () => {
    await expect(
      quickRegisterVehicle({
        plateNumber: "",
        make: "Toyota",
        model: "Camry",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when make is missing", async () => {
    await expect(
      quickRegisterVehicle({
        plateNumber: "ABC123",
        make: "",
        model: "Camry",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when model is missing", async () => {
    await expect(
      quickRegisterVehicle({
        plateNumber: "ABC123",
        make: "Toyota",
        model: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("creates new vehicle and matches existing customer by phone", async () => {
    // findCustomerByPhone will match -> customerId set from existing
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: {
        id: "cust-1",
        first_name: "John",
        last_name: "Doe",
        phone: "1234567890",
      },
      error: null,
    });
    // Existing vehicle check -> not found
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    const createdVehicle = {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    };
    vi.mocked(createVehicle).mockResolvedValueOnce(createdVehicle as unknown as Vehicle);

    const result = await quickRegisterVehicle({
      plateNumber: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Blue",
      customerPhone: "1234567890",
    });

    expect(result.vehicle).toEqual(createdVehicle);
    expect(result.customerId).toBe("cust-1");
    expect(result.isUpdate).toBe(false);
    expect(createVehicle).toHaveBeenCalled();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("creates customer and vehicle when customer phone is new", async () => {
    // findCustomerByPhone -> not found
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    // Existing vehicle check -> not found
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(createCustomer).mockResolvedValueOnce({ id: "cust-new" } as unknown as Customer);
    const createdVehicle = {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    };
    vi.mocked(createVehicle).mockResolvedValueOnce(createdVehicle as unknown as Vehicle);

    const result = await quickRegisterVehicle({
      plateNumber: "ABC123",
      make: "Toyota",
      model: "Camry",
      customerFirstName: "Jane",
      customerLastName: "Smith",
      customerPhone: "9998887777",
    });

    expect(result.vehicle).toEqual(createdVehicle);
    expect(result.customerId).toBe("cust-new");
    expect(createCustomer).toHaveBeenCalled();
  });

  it("updates existing vehicle when plate already in DB", async () => {
    // Existing vehicle check -> found
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: { id: "v-1" },
      error: null,
    });
    const updatedVehicle = {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    };
    vi.mocked(updateVehicle).mockResolvedValueOnce(updatedVehicle as unknown as Vehicle);

    const result = await quickRegisterVehicle({
      plateNumber: "ABC123",
      make: "Toyota",
      model: "Camry",
    });

    expect(result.isUpdate).toBe(true);
    expect(result.vehicle).toEqual(updatedVehicle);
    expect(updateVehicle).toHaveBeenCalled();
    expect(createVehicle).not.toHaveBeenCalled();
  });

  it("does not create customer when phone is provided but no first name", async () => {
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockClient.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(createVehicle).mockResolvedValueOnce({ id: "v-1" } as unknown as Vehicle);

    const result = await quickRegisterVehicle({
      plateNumber: "ABC123",
      make: "Toyota",
      model: "Camry",
      customerPhone: "9998887777",
    });

    expect(result.customerId).toBeNull();
    expect(createCustomer).not.toHaveBeenCalled();
  });
});

// ─── searchMechanics ──────────────────────────────────────────

describe("searchMechanics", () => {
  const mechanics = [
    { id: "m-1", full_name: "Alice Adams", phone: "111", is_active: true },
    { id: "m-2", full_name: "Bob Brown", phone: "222", is_active: true },
  ];

  it("returns all mechanics when no search term", async () => {
    mockClient.__qb.resolveOnce({ data: mechanics, error: null });

    const result = await searchMechanics();

    expect(result).toEqual(mechanics);
    expect(mockClient.from).toHaveBeenCalledWith("profiles");
  });

  it("filters by search term", async () => {
    const filtered = [mechanics[0]];
    mockClient.__qb.resolveOnce({ data: filtered, error: null });

    const result = await searchMechanics("Alice");

    expect(result).toEqual(filtered);
    expect(mockClient.from("profiles").ilike).toHaveBeenCalledWith(
      "full_name",
      "%Alice%",
    );
  });

  it("returns empty array when no mechanics match", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await searchMechanics("XYZ");

    expect(result).toEqual([]);
  });
});

// ─── searchVehicles ───────────────────────────────────────────

describe("searchVehicles", () => {
  const vehicles = [
    {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Blue",
    },
    {
      id: "v-2",
      plate_number: "XYZ789",
      make: "Honda",
      model: "Civic",
      year: 2021,
      color: "Red",
    },
  ];

  it("returns all vehicles when no search term", async () => {
    mockClient.__qb.resolveOnce({ data: vehicles, error: null });

    const result = await searchVehicles();

    expect(result).toEqual(vehicles);
    expect(mockClient.from).toHaveBeenCalledWith("vehicles");
    expect(mockClient.from("vehicles").limit).toHaveBeenCalledWith(20);
  });

  it("filters by search term with OR across fields", async () => {
    const filtered = [vehicles[0]];
    mockClient.__qb.resolveOnce({ data: filtered, error: null });

    const result = await searchVehicles("ABC");

    expect(result).toEqual(filtered);
    expect(mockClient.from("vehicles").or).toHaveBeenCalledWith(
      expect.stringContaining("plate_number.ilike.%ABC%"),
    );
  });

  it("returns empty array when nothing matches", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await searchVehicles("NONEXISTENT");

    expect(result).toEqual([]);
  });
});

// ─── searchVehiclesWithCustomers ──────────────────────────────

describe("searchVehiclesWithCustomers", () => {
  const rawVehicles = [
    {
      id: "v-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "Blue",
      vehicle_owners: [
        {
          owned_until: null,
          customers: {
            id: "cust-1",
            first_name: "John",
            last_name: "Doe",
            phone: "1234567890",
          },
        },
      ],
    },
    {
      id: "v-2",
      plate_number: "XYZ789",
      make: "Honda",
      model: "Civic",
      year: 2021,
      color: "Red",
      vehicle_owners: [],
    },
  ];

  it("returns flattened vehicles with customer info", async () => {
    mockClient.__qb.resolveOnce({ data: rawVehicles, error: null });

    const result = await searchVehiclesWithCustomers();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "v-1",
      plate_number: "ABC123",
      customer: {
        id: "cust-1",
        first_name: "John",
        last_name: "Doe",
        phone: "1234567890",
      },
    });
    expect(result[1]).toMatchObject({
      id: "v-2",
      customer: null,
    });
  });

  it("filters by search term when provided", async () => {
    mockClient.__qb.resolveOnce({ data: [rawVehicles[0]], error: null });

    const result = await searchVehiclesWithCustomers("ABC");

    expect(result).toHaveLength(1);
    expect(result[0].plate_number).toBe("ABC123");
    expect(mockClient.from("vehicles").or).toHaveBeenCalled();
  });

  it("returns empty array on no results", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await searchVehiclesWithCustomers("NONEXISTENT");

    expect(result).toEqual([]);
  });
});

// ─── registerMechanic ─────────────────────────────────────────

describe("registerMechanic", () => {
  it("throws ValidationError when email is missing", async () => {
    await expect(
      registerMechanic({ email: "", fullName: "Test User" }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when name is missing", async () => {
    await expect(
      registerMechanic({ email: "test@test.com", fullName: "" }),
    ).rejects.toThrow(ValidationError);
  });

  it("registers new mechanic when auth user does not exist", async () => {
    const serviceRoleClient = createMockAdminClient();
    serviceRoleClient.auth.admin = {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null,
      }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-auth-id" } },
        error: null,
      }),
    };
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      serviceRoleClient,
    );

    const profile = {
      id: "new-auth-id",
      full_name: "Test User",
      phone: "1234567890",
      is_active: true,
    };
    mockClient.from("profiles").single.mockResolvedValueOnce({
      data: profile,
      error: null,
    });

    const result = await registerMechanic({
      email: "test@test.com",
      fullName: "Test User",
      phone: "1234567890",
    });

    expect(result).toEqual(profile);
    expect(serviceRoleClient.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@test.com",
        email_confirm: true,
      }),
    );
    expect(mockClient.from("profiles").upsert).toHaveBeenCalled();
  });

  it("reuses existing auth user when found by email", async () => {
    const serviceRoleClient = createMockAdminClient();
    serviceRoleClient.auth.admin = {
      listUsers: vi.fn().mockResolvedValue({
        data: {
          users: [{ id: "existing-auth-id", email: "existing@test.com" }],
        },
        error: null,
      }),
      createUser: vi.fn(),
    };
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      serviceRoleClient,
    );

    const profile = {
      id: "existing-auth-id",
      full_name: "Existing User",
      phone: null,
      is_active: true,
    };
    mockClient.from("profiles").single.mockResolvedValueOnce({
      data: profile,
      error: null,
    });

    await registerMechanic({
      email: "existing@test.com",
      fullName: "Existing User",
    });

    expect(serviceRoleClient.auth.admin.createUser).not.toHaveBeenCalled();
    expect(
      serviceRoleClient.auth.admin.listUsers,
    ).toHaveBeenCalledWith({ perPage: 1000 });
    expect(mockClient.from("profiles").upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing-auth-id" }),
    );
  });

  it("throws when admin user creation fails", async () => {
    const serviceRoleClient = createMockAdminClient();
    serviceRoleClient.auth.admin = {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null,
      }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Email already registered" },
      }),
    };
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      serviceRoleClient,
    );

    await expect(
      registerMechanic({
        email: "fail@test.com",
        fullName: "Fail User",
      }),
    ).rejects.toThrow("Email already registered");
  });

  it("throws when profile upsert fails", async () => {
    const serviceRoleClient = createMockAdminClient();
    serviceRoleClient.auth.admin = {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null,
      }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-auth-id" } },
        error: null,
      }),
    };
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      serviceRoleClient,
    );

    mockClient.from("profiles").single.mockResolvedValueOnce({
      data: null,
      error: { message: "Upsert failed" },
    });

    await expect(
      registerMechanic({
        email: "test@test.com",
        fullName: "Test User",
      }),
    ).rejects.toThrow("Upsert failed");
  });
});

// ─── getVehicleServiceTimeline ────────────────────────────────

describe("getVehicleServiceTimeline", () => {
  const workOrders = [
    {
      id: "wo-1",
      status: "completed",
      bay_number: 2,
      created_at: "2026-06-15T10:00:00Z",
      complaint: "Brake service",
      diagnosis: "Worn pads",
      notes: "Replaced all pads",
      total: 350,
      mechanic_id: "mech-1",
    },
    {
      id: "wo-2",
      status: "in_progress",
      bay_number: null,
      created_at: "2026-07-01T09:00:00Z",
      complaint: "Oil change",
      diagnosis: null,
      notes: null,
      total: 120,
      mechanic_id: null,
    },
  ];

  const profiles = [{ id: "mech-1", full_name: "Mike Mechanic" }];

  const services = [
    {
      work_order_id: "wo-1",
      service_name: "Brake Pad Replacement",
      final_price: 350,
    },
  ];

  it("returns service history with mechanic names and services", async () => {
    mockClient.__qb.resolveOnce({ data: workOrders, error: null });
    mockClient.__qb.resolveOnce({ data: profiles, error: null });
    mockClient.__qb.resolveOnce({ data: services, error: null });

    const result = await getVehicleServiceTimeline("v-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      work_order_id: "wo-1",
      status: "completed",
      bay_number: 2,
      mechanic_name: "Mike Mechanic",
      services: [{ name: "Brake Pad Replacement", price: 350 }],
    });
    expect(result[1]).toMatchObject({
      work_order_id: "wo-2",
      mechanic_name: null,
      services: [],
    });
  });

  it("returns empty array when work orders query errors", async () => {
    mockClient.__qb.resolveOnce({ data: null, error: { message: "DB error" } });

    const result = await getVehicleServiceTimeline("v-1");

    expect(result).toEqual([]);
  });

  it("handles vehicle with no work orders", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getVehicleServiceTimeline("v-1");

    expect(result).toEqual([]);
  });
});

// ─── addVehicleToQueue ────────────────────────────────────────

describe("addVehicleToQueue", () => {
  it("throws ValidationError when vehicleId is missing", async () => {
    await expect(
      addVehicleToQueue({ vehicleId: "" }),
    ).rejects.toThrow(ValidationError);
  });

  it("creates work order when branch is provided and no active WO", async () => {
    // No branch lookup needed since branchId is provided
    // Active WO check -> none found
    mockClient.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(createWorkOrder).mockResolvedValueOnce({
      id: "wo-new",
    } as unknown as WorkOrderDetail);

    const result = await addVehicleToQueue({
      vehicleId: "v-1",
      customerId: "cust-1",
      complaint: "Check engine light",
      branchId: "branch-1",
    });

    expect(result.workOrderId).toBe("wo-new");
    expect(createWorkOrder).toHaveBeenCalledWith(
      expect.anything(),
      ORG_ID,
      expect.objectContaining({
        customer_id: "cust-1",
        vehicle_id: "v-1",
        branchId: "branch-1",
        complaint: "Check engine light",
      }),
    );
  });

  it("resolves main branch when branchId not provided", async () => {
    // Main branch lookup
    mockClient.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: "main-branch" },
      error: null,
    });
    // Active WO check -> none
    mockClient.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(createWorkOrder).mockResolvedValueOnce({
      id: "wo-new",
    } as unknown as WorkOrderDetail);

    const result = await addVehicleToQueue({
      vehicleId: "v-1",
    });

    expect(result.workOrderId).toBe("wo-new");
    expect(mockClient.from).toHaveBeenCalledWith("branches");
    expect(createWorkOrder).toHaveBeenCalledWith(
      expect.anything(),
      ORG_ID,
      expect.objectContaining({ branchId: "main-branch" }),
    );
  });

  it("throws when no branch found and none provided", async () => {
    mockClient.from("branches").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      addVehicleToQueue({ vehicleId: "v-1" }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws when vehicle has an active work order", async () => {
    mockClient.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: "branch-1" },
      error: null,
    });
    // Active WO check -> found
    mockClient.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: { id: "wo-active", status: "in_progress", bay_number: 3 },
      error: null,
    });

    await expect(
      addVehicleToQueue({ vehicleId: "v-1" }),
    ).rejects.toThrow("already assigned to Bay #3");
  });

  it("throws when vehicle is already in queue (no bay)", async () => {
    mockClient.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: "branch-1" },
      error: null,
    });
    // Active WO check -> found without bay
    mockClient.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: { id: "wo-queued", status: "pending", bay_number: null },
      error: null,
    });

    await expect(
      addVehicleToQueue({ vehicleId: "v-1" }),
    ).rejects.toThrow("already in the waiting queue");
  });

  it("handles DB error during main branch lookup gracefully", async () => {
    mockClient.from("branches").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      addVehicleToQueue({ vehicleId: "v-1" }),
    ).rejects.toThrow(ValidationError);
  });
});
