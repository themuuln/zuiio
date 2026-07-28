import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCustomerMock = vi.fn();
const updateCustomerMock = vi.fn();
const deleteCustomerMock = vi.fn();
const getCustomerVehiclesMock = vi.fn();
const getCustomerWorkOrdersMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/customer-service", () => ({
  getCustomer: getCustomerMock,
  updateCustomer: updateCustomerMock,
  deleteCustomer: deleteCustomerMock,
}));

vi.mock("@/lib/services/vehicle-service", () => ({
  getCustomerVehicles: getCustomerVehiclesMock,
  getCustomerWorkOrders: getCustomerWorkOrdersMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

describe("organizations/[id]/customers/[customerId] route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/customers/${customerId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns customer with vehicles and work orders", async () => {
      const customer = { id: customerId, name: "John" };
      const vehicles = [{ id: "v-1", plate: "ABC123" }];
      const workOrders = [{ id: "wo-1", status: "open" }];
      getCustomerMock.mockResolvedValue(customer);
      getCustomerVehiclesMock.mockResolvedValue(vehicles);
      getCustomerWorkOrdersMock.mockResolvedValue(workOrders);

      const response = await (GET as any)({
        supabase: {},
        orgId,
        params: { customerId },
      });
      const body = await response.json();

      expect(getCustomerMock).toHaveBeenCalledWith({}, customerId, orgId);
      expect(getCustomerVehiclesMock).toHaveBeenCalledWith(
        {},
        orgId,
        customerId,
      );
      expect(getCustomerWorkOrdersMock).toHaveBeenCalledWith(
        {},
        orgId,
        customerId,
      );
      expect(body.data).toEqual({
        ...customer,
        vehicles,
        work_orders: workOrders,
      });
    });

    it("handles service error", async () => {
      getCustomerMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ supabase: {}, orgId, params: { customerId } }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("PATCH", () => {
    const body = { name: "Updated" };

    it("updates and returns customer", async () => {
      const updated = { id: customerId, name: "Updated" };
      updateCustomerMock.mockResolvedValue(updated);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const response = await (PATCH as any)({
        request: req,
        supabase: {},
        orgId,
        params: { customerId },
        user,
      });
      const responseBody = await response.json();

      expect(updateCustomerMock).toHaveBeenCalledWith(
        {},
        customerId,
        orgId,
        body,
        user.id,
      );
      expect(responseBody.data).toEqual(updated);
    });

    it("handles service error", async () => {
      updateCustomerMock.mockRejectedValue(new Error("Update failed"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await expect(
        (PATCH as any)({
          request: req,
          supabase: {},
          orgId,
          params: { customerId },
          user,
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("DELETE", () => {
    it("deletes customer and returns ok(null)", async () => {
      deleteCustomerMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        supabase: {},
        orgId,
        params: { customerId },
        user,
      });
      const body = await response.json();

      expect(deleteCustomerMock).toHaveBeenCalledWith(
        {},
        customerId,
        orgId,
        user.id,
      );
      expect(body.data).toBeNull();
    });

    it("handles service error", async () => {
      deleteCustomerMock.mockRejectedValue(new Error("Delete failed"));

      await expect(
        (DELETE as any)({ supabase: {}, orgId, params: { customerId }, user }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
