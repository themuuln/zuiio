import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuditLog } from "@/lib/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

import {
  createVehicle,
  deleteVehicle,
  getCustomerVehicles,
  getVehicle,
  getVehicleServiceHistory,
  getVehicles,
  searchByPlate,
  updateVehicle,
} from "./vehicle-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: unknown, fn: () => unknown) => fn()),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ORG_ID = "org-1";
const USER_ID = "user-1";

function setupMockClient() {
  const client = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return client;
}

// ─── createVehicle ─────────────────────────────────────────────────

describe("createVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates vehicle with plate number, make, model, year, links to customer via vehicle_owners", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "4444УНА",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        organization_id: ORG_ID,
        created_by: USER_ID,
        updated_by: USER_ID,
      },
      error: null,
    });

    const result = await createVehicle(
      ORG_ID,
      {
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        customerId: "c-1",
      },
      USER_ID,
    );

    expect(result.plate_number).toBe("4444УНА");
    expect(result.make).toBe("Toyota");
    expect(result.model).toBe("Camry");
    expect(result.year).toBe(2020);

    const ownersBuilder = client.from("vehicle_owners");
    expect(ownersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: "v-1",
        customer_id: "c-1",
        is_primary: true,
        created_by: USER_ID,
      }),
    );
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "vehicles",
        record_id: "v-1",
        organization_id: ORG_ID,
        user_id: USER_ID,
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(`vehicles:${ORG_ID}`, "max");
  });

  it("rejects empty plate number", async () => {
    setupMockClient();
    await expect(
      createVehicle(
        ORG_ID,
        { plateNumber: "", make: "Toyota", model: "Camry" },
        USER_ID,
      ),
    ).rejects.toThrow("Plate number is required");
  });

  it("rejects empty make", async () => {
    setupMockClient();
    await expect(
      createVehicle(
        ORG_ID,
        { plateNumber: "4444УНА", make: "", model: "Camry" },
        USER_ID,
      ),
    ).rejects.toThrow("Make is required");
  });

  it("rejects empty model", async () => {
    setupMockClient();
    await expect(
      createVehicle(
        ORG_ID,
        { plateNumber: "4444УНА", make: "Toyota", model: "" },
        USER_ID,
      ),
    ).rejects.toThrow("Model is required");
  });

  it("rejects duplicate plate number within same org", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: { id: "existing", plate_number: "4444УНА" },
      error: null,
    });

    await expect(
      createVehicle(
        ORG_ID,
        { plateNumber: "4444УНА", make: "Toyota", model: "Camry" },
        USER_ID,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("with customerId — creates vehicle_owners link with is_primary: true", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-2",
        plate_number: "5555УНА",
        make: "Honda",
        model: "Civic",
        organization_id: ORG_ID,
        created_by: USER_ID,
        updated_by: USER_ID,
      },
      error: null,
    });

    await createVehicle(
      ORG_ID,
      {
        plateNumber: "5555УНА",
        make: "Honda",
        model: "Civic",
        customerId: "c-2",
      },
      USER_ID,
    );

    const ownersBuilder = client.from("vehicle_owners");
    expect(ownersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicle_id: "v-2",
        customer_id: "c-2",
        is_primary: true,
        created_by: USER_ID,
      }),
    );
  });

  it("without customerId — creates vehicle without owner link", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-3",
        plate_number: "6666УНА",
        make: "Ford",
        model: "Focus",
        organization_id: ORG_ID,
        created_by: USER_ID,
        updated_by: USER_ID,
      },
      error: null,
    });

    await createVehicle(
      ORG_ID,
      { plateNumber: "6666УНА", make: "Ford", model: "Focus" },
      USER_ID,
    );

    // insert was called for vehicle creation, verify no vehicle_owners link was added
    const insertMock = client.from("vehicle_owners").insert;
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).not.toHaveProperty("customer_id");
  });

  it("creates audit log on success", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: { id: "v-4", plate_number: "7777УНА", make: "BMW", model: "X5" },
      error: null,
    });

    await createVehicle(
      ORG_ID,
      { plateNumber: "7777УНА", make: "BMW", model: "X5" },
      USER_ID,
    );

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "vehicles",
        record_id: "v-4",
        organization_id: ORG_ID,
        user_id: USER_ID,
      }),
    );
  });

  it("revalidates vehicles cache tag", async () => {
    const client = setupMockClient();
    client.from("vehicles").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: { id: "v-5", plate_number: "8888УНА", make: "Audi", model: "A4" },
      error: null,
    });

    await createVehicle(
      ORG_ID,
      { plateNumber: "8888УНА", make: "Audi", model: "A4" },
      USER_ID,
    );

    expect(revalidateTag).toHaveBeenCalledWith(`vehicles:${ORG_ID}`, "max");
  });
});

// ─── getVehicle ────────────────────────────────────────────────────

describe("getVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns vehicle with owners array and recent_work_orders array", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "ABC123",
        make: "Toyota",
        model: "Camry",
        year: 2020,
      },
      error: null,
    });

    const result = await getVehicle("v-1", ORG_ID);

    expect(result.id).toBe("v-1");
    expect(result.plate_number).toBe("ABC123");
    expect(result.make).toBe("Toyota");
    expect(Array.isArray(result.owners)).toBe(true);
    expect(Array.isArray(result.recent_work_orders)).toBe(true);
  });

  it("throws NotFoundError when vehicle doesn't exist", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    await expect(getVehicle("nonexistent", ORG_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ─── getVehicles ───────────────────────────────────────────────────

describe("getVehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns vehicles with owner_name and owner_phone from vehicle_owners join", async () => {
    const client = setupMockClient();
    client.from("vehicles").limit.mockResolvedValueOnce({
      data: [
        {
          id: "v-1",
          plate_number: "ABC123",
          make: "Toyota",
          model: "Camry",
          year: 2020,
          vehicle_owners: [
            {
              customer_id: "c-1",
              customers: {
                first_name: "John",
                last_name: "Doe",
                phone: "555-0100",
              },
            },
          ],
        },
        {
          id: "v-2",
          plate_number: "DEF456",
          make: "Honda",
          model: "Civic",
          year: 2021,
          vehicle_owners: [
            {
              customer_id: "c-2",
              customers: {
                first_name: "Jane",
                last_name: "Smith",
                phone: "555-0200",
              },
            },
          ],
        },
      ],
      error: null,
    });

    const results = await getVehicles(ORG_ID);

    expect(results).toHaveLength(2);
    expect(results[0].owner_name).toBe("John Doe");
    expect(results[0].owner_phone).toBe("555-0100");
    expect(results[1].owner_name).toBe("Jane Smith");
    expect(results[1].owner_phone).toBe("555-0200");
  });

  it("supports search parameter (filters by plate_number or vin)", async () => {
    const client = setupMockClient();
    client.from("vehicles").limit.mockResolvedValueOnce({
      data: [
        {
          id: "v-1",
          plate_number: "ABC123",
          make: "Toyota",
          model: "Camry",
          vehicle_owners: [
            {
              customer_id: "c-1",
              customers: {
                first_name: "John",
                last_name: "Doe",
                phone: null,
              },
            },
          ],
        },
      ],
      error: null,
    });

    const results = await getVehicles(ORG_ID, { search: "ABC" });

    const vehicleBuilder = client.from("vehicles");
    expect(vehicleBuilder.or).toHaveBeenCalledWith(
      "plate_number.ilike.%ABC%,vin.ilike.%ABC%",
    );
    expect(results).toHaveLength(1);
    expect(results[0].plate_number).toBe("ABC123");
  });

  it("supports customerId filter (filters by vehicle_owners.customer_id)", async () => {
    const client = setupMockClient();
    client.from("vehicles").limit.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await getVehicles(ORG_ID, { customerId: "c-42" });

    const vehicleBuilder = client.from("vehicles");
    expect(vehicleBuilder.eq).toHaveBeenCalledWith(
      "vehicle_owners.customer_id",
      "c-42",
    );
  });
});

// ─── searchByPlate ─────────────────────────────────────────────────

describe("searchByPlate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to getVehicles with search param and returns matching vehicles", async () => {
    const client = setupMockClient();
    client.from("vehicles").limit.mockResolvedValueOnce({
      data: [
        {
          id: "v-1",
          plate_number: "ABC123",
          make: "Toyota",
          model: "Camry",
          vehicle_owners: [
            {
              customer_id: "c-1",
              customers: {
                first_name: "John",
                last_name: "Doe",
                phone: "555-0100",
              },
            },
          ],
        },
      ],
      error: null,
    });

    const results = await searchByPlate(ORG_ID, "ABC");

    const vehicleBuilder = client.from("vehicles");
    expect(vehicleBuilder.or).toHaveBeenCalledWith(
      "plate_number.ilike.%ABC%,vin.ilike.%ABC%",
    );
    expect(results).toHaveLength(1);
    expect(results[0].plate_number).toBe("ABC123");
    expect(results[0].owner_name).toBe("John Doe");
  });
});

// ─── updateVehicle ─────────────────────────────────────────────────

describe("updateVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates vehicle fields (plate_number, make, model, year, vin)", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "1111УНА",
        make: "OldMake",
        model: "OldModel",
        year: 2019,
      },
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "2222УНА",
        make: "NewMake",
        model: "NewModel",
        year: 2023,
        vin: "1HGCM82633A004352",
      },
      error: null,
    });

    const result = await updateVehicle(
      "v-1",
      ORG_ID,
      {
        plateNumber: "2222УНА",
        make: "NewMake",
        model: "NewModel",
        year: 2023,
        vin: "1HGCM82633A004352",
      },
      USER_ID,
    );

    expect(result.plate_number).toBe("2222УНА");
    expect(result.make).toBe("NewMake");
    expect(result.model).toBe("NewModel");
    expect(result.year).toBe(2023);
    expect(result.vin).toBe("1HGCM82633A004352");
  });

  it("throws NotFoundError when vehicle not found", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    await expect(
      updateVehicle("nonexistent", ORG_ID, { make: "Toyota" }, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when no fields to update", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "4444УНА",
        make: "Toyota",
        model: "Camry",
      },
      error: null,
    });

    await expect(updateVehicle("v-1", ORG_ID, {}, USER_ID)).rejects.toThrow(
      ValidationError,
    );
  });

  it("when customerId changes — deactivates old ownership, creates new", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "4444УНА",
        make: "Toyota",
        model: "Camry",
      },
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "4444УНА",
        make: "Toyota",
        model: "Camry",
      },
      error: null,
    });

    await updateVehicle(
      "v-1",
      ORG_ID,
      { plateNumber: "2222УНА", customerId: "c-2" },
      USER_ID,
    );

    const ownersBuilder = client.from("vehicle_owners");
    expect(ownersBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ owned_until: expect.any(String) }),
    );
    expect(ownersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: "v-1",
        customer_id: "c-2",
        is_primary: true,
        created_by: USER_ID,
      }),
    );
  });

  it("creates audit log", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "4444УНА",
        make: "Toyota",
        model: "Camry",
      },
      error: null,
    });
    client.from("vehicles").single.mockResolvedValueOnce({
      data: {
        id: "v-1",
        plate_number: "3333УНА",
        make: "Toyota",
        model: "Camry",
      },
      error: null,
    });

    await updateVehicle("v-1", ORG_ID, { plateNumber: "3333УНА" }, USER_ID);

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "vehicles",
        record_id: "v-1",
        organization_id: ORG_ID,
        user_id: USER_ID,
      }),
    );
  });
});

// ─── deleteVehicle ─────────────────────────────────────────────────

describe("deleteVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft deletes (sets deleted_at and updated_by)", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: { id: "v-1" },
      error: null,
    });

    await deleteVehicle("v-1", ORG_ID, USER_ID);

    const vehicleBuilder = client.from("vehicles");
    expect(vehicleBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
        updated_by: USER_ID,
      }),
    );
  });

  it("throws NotFoundError when vehicle not found", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(deleteVehicle("nonexistent", ORG_ID, USER_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("creates audit log for soft_delete", async () => {
    const client = setupMockClient();
    client.from("vehicles").single.mockResolvedValueOnce({
      data: { id: "v-1" },
      error: null,
    });

    await deleteVehicle("v-1", ORG_ID, USER_ID);

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: "vehicles",
        record_id: "v-1",
        organization_id: ORG_ID,
        user_id: USER_ID,
      }),
    );
  });
});

// ─── getVehicleServiceHistory ──────────────────────────────────────

describe("getVehicleServiceHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns work orders with work_order_services for a vehicle, ordered by created_at descending", async () => {
    const client = setupMockClient();
    client.from("work_orders").order.mockResolvedValueOnce({
      data: [
        {
          id: "wo-1",
          status: "completed",
          vehicle_id: "v-1",
          complaint: "Oil change",
          total: 150,
          created_at: "2026-05-01T10:00:00Z",
          work_order_services: [
            {
              id: "wos-1",
              service_name: "Oil Change",
              quantity: 1,
              price: 150,
            },
          ],
        },
        {
          id: "wo-2",
          status: "in_progress",
          vehicle_id: "v-1",
          complaint: "Brake pad replacement",
          total: 350,
          created_at: "2026-04-28T09:00:00Z",
          work_order_services: [
            {
              id: "wos-2",
              service_name: "Brake Pads",
              quantity: 2,
              price: 175,
            },
          ],
        },
      ],
      error: null,
    });

    const results = await getVehicleServiceHistory(ORG_ID, "v-1");

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("wo-1");
    expect(results[0].status).toBe("completed");
    expect(results[0].work_order_services).toHaveLength(1);
    expect(results[0].work_order_services[0].service_name).toBe("Oil Change");

    expect(results[1].id).toBe("wo-2");
    expect(results[1].work_order_services).toHaveLength(1);

    const woBuilder = client.from("work_orders");
    expect(woBuilder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });
});

// ─── getCustomerVehicles ───────────────────────────────────────────

describe("getCustomerVehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns vehicles owned by a specific customer via vehicle_owners", async () => {
    const client = setupMockClient();
    client.from("vehicle_owners").is.mockResolvedValueOnce({
      data: [
        {
          vehicle_id: "v-1",
          vehicles: {
            id: "v-1",
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
            year: 2020,
            organization_id: ORG_ID,
          },
        },
        {
          vehicle_id: "v-2",
          vehicles: {
            id: "v-2",
            plate_number: "DEF456",
            make: "Honda",
            model: "Civic",
            year: 2021,
            organization_id: ORG_ID,
          },
        },
      ],
      error: null,
    });

    const results = await getCustomerVehicles(ORG_ID, "c-1");

    expect(results).toHaveLength(2);
    expect(results[0].plate_number).toBe("ABC123");
    expect(results[0].make).toBe("Toyota");
    expect(results[1].plate_number).toBe("DEF456");
    expect(results[1].make).toBe("Honda");

    const voBuilder = client.from("vehicle_owners");
    expect(voBuilder.eq).toHaveBeenCalledWith("customer_id", "c-1");
  });
});
