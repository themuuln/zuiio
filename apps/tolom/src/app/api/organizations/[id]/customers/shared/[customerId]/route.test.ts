import { beforeEach, describe, expect, it, vi } from "vitest";

const getSharedCustomerMock = vi.fn();
const getSharedCustomerVehiclesMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/customer-service", () => ({
  getSharedCustomer: getSharedCustomerMock,
  getSharedCustomerVehicles: getSharedCustomerVehiclesMock,
}));

const { GET } = await import("./route");

describe("organizations/[id]/customers/shared/[customerId] route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns shared customer with vehicles", async () => {
      const customer = { id: customerId, name: "Shared Customer" };
      const vehicles = [{ id: "v-1", plate: "ABC123" }];
      getSharedCustomerMock.mockResolvedValue(customer);
      getSharedCustomerVehiclesMock.mockResolvedValue(vehicles);

      const response = await (GET as any)({
        supabase: {},
        orgId,
        params: { customerId },
      });
      const body = await response.json();

      expect(getSharedCustomerMock).toHaveBeenCalledWith({}, customerId, orgId);
      expect(getSharedCustomerVehiclesMock).toHaveBeenCalledWith(
        {},
        customerId,
        orgId,
      );
      expect(body.data).toEqual({ ...customer, vehicles });
    });

    it("handles service error", async () => {
      getSharedCustomerMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ supabase: {}, orgId, params: { customerId } }),
      ).rejects.toThrow("DB error");
    });
  });
});
