import { describe, expect, it, vi } from "vitest";
import { type GlobalSearchResult, globalSearch } from "./global-search-service";

const searchCustomersMock = vi.fn();
const getVehiclesMock = vi.fn();
const getWorkOrdersMock = vi.fn();
const getInventoryFastMock = vi.fn();

vi.mock("./customer-service", () => ({
  searchCustomers: (...args: unknown[]) => searchCustomersMock(...args),
}));
vi.mock("./vehicle-service", () => ({
  getVehicles: (...args: unknown[]) => getVehiclesMock(...args),
}));
vi.mock("./work-order-service", () => ({
  getWorkOrders: (...args: unknown[]) => getWorkOrdersMock(...args),
}));
vi.mock("./inventory-service", () => ({
  getInventoryFast: (...args: unknown[]) => getInventoryFastMock(...args),
}));

const db = {} as never;

const EMPTY: GlobalSearchResult = {
  customers: [],
  vehicles: [],
  workOrders: [],
  parts: [],
};

describe("globalSearch", () => {
  it("returns empty sections without calling services for short queries", async () => {
    const result = await globalSearch(db, "org-1", "a");

    expect(result).toEqual(EMPTY);
    expect(searchCustomersMock).not.toHaveBeenCalled();
    expect(getVehiclesMock).not.toHaveBeenCalled();
    expect(getWorkOrdersMock).not.toHaveBeenCalled();
    expect(getInventoryFastMock).not.toHaveBeenCalled();
  });

  it("queries all four entities in parallel with org scoping and the search term", async () => {
    searchCustomersMock.mockResolvedValue({ data: [] });
    getVehiclesMock.mockResolvedValue([]);
    getWorkOrdersMock.mockResolvedValue([]);
    getInventoryFastMock.mockResolvedValue([]);

    await globalSearch(db, "org-1", "7257УБА");

    expect(searchCustomersMock).toHaveBeenCalledWith(db, "org-1", "7257УБА", {
      page: 1,
      pageSize: 5,
    });
    expect(getVehiclesMock).toHaveBeenCalledWith(db, "org-1", {
      search: "7257УБА",
      limit: 5,
    });
    expect(getWorkOrdersMock).toHaveBeenCalledWith(
      db,
      "org-1",
      { search: "7257УБА" },
      1,
      5,
    );
    expect(getInventoryFastMock).toHaveBeenCalledWith(db, "org-1", {
      search: "7257УБА",
      limit: 5,
    });
  });

  it("maps customer hits to name + phone", async () => {
    searchCustomersMock.mockResolvedValue({
      data: [
        {
          id: "c1",
          full_name: "Bat Delger",
          first_name: "Bat",
          last_name: "Delger",
          phone: "9911",
        },
        {
          id: "c2",
          full_name: null,
          first_name: "Saraa",
          last_name: null,
          phone: null,
        },
      ],
    });
    getVehiclesMock.mockResolvedValue([]);
    getWorkOrdersMock.mockResolvedValue([]);
    getInventoryFastMock.mockResolvedValue([]);

    const result = await globalSearch(db, "org-1", "bat");

    expect(result.customers).toEqual([
      { id: "c1", name: "Bat Delger", phone: "9911" },
      { id: "c2", name: "Saraa", phone: null },
    ]);
  });

  it("maps vehicle, work order and part hits", async () => {
    searchCustomersMock.mockResolvedValue({ data: [] });
    getVehiclesMock.mockResolvedValue([
      {
        id: "v1",
        plate_number: "7257УБА",
        make: "Toyota",
        model: "Prado",
        year: 2019,
        owner_name: "Bat",
      },
    ]);
    getWorkOrdersMock.mockResolvedValue([
      {
        id: "wo1",
        status: "In Progress",
        created_at: "2026-08-01T08:00:00Z",
        customer: { first_name: "Bat", last_name: "Delger" },
        vehicle: { plate_number: "7257УБА" },
      },
    ]);
    getInventoryFastMock.mockResolvedValue([
      {
        part_id: "p1",
        part_name: "Air Filter",
        part_number: "AF-100",
        quantity_on_hand: 4,
      },
    ]);

    const result = await globalSearch(db, "org-1", "7257УБА");

    expect(result.vehicles).toEqual([
      {
        id: "v1",
        plateNumber: "7257УБА",
        make: "Toyota",
        model: "Prado",
        year: 2019,
        ownerName: "Bat",
      },
    ]);
    expect(result.workOrders).toEqual([
      {
        id: "wo1",
        plateNumber: "7257УБА",
        customerName: "Bat Delger",
        status: "In Progress",
        createdAt: "2026-08-01T08:00:00Z",
      },
    ]);
    expect(result.parts).toEqual([
      { id: "p1", name: "Air Filter", partNumber: "AF-100", stock: 4 },
    ]);
  });

  it("caps the per-entity limit at 8", async () => {
    searchCustomersMock.mockResolvedValue({ data: [] });
    getVehiclesMock.mockResolvedValue([]);
    getWorkOrdersMock.mockResolvedValue([]);
    getInventoryFastMock.mockResolvedValue([]);

    await globalSearch(db, "org-1", "term", { limit: 99 });

    expect(searchCustomersMock).toHaveBeenCalledWith(db, "org-1", "term", {
      page: 1,
      pageSize: 8,
    });
    expect(getVehiclesMock).toHaveBeenCalledWith(db, "org-1", {
      search: "term",
      limit: 8,
    });
  });
});
