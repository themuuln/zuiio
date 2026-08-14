import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteCustomerCommunicationMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/communication-service", () => ({
  deleteCustomerCommunication: deleteCustomerCommunicationMock,
}));

const { DELETE } = await import("./route");

describe("organizations/[id]/customers/[customerId]/communications/[commId] route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";
  const commId = "comm-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("deletes communication and returns ok(null)", async () => {
      deleteCustomerCommunicationMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        supabase: {},
        orgId,
        params: { customerId, commId },
        user,
      });
      const body = await response.json();

      expect(deleteCustomerCommunicationMock).toHaveBeenCalledWith(
        {},
        orgId,
        customerId,
        commId,
        user.id,
      );
      expect(body.data).toBeNull();
    });

    it("handles service error", async () => {
      deleteCustomerCommunicationMock.mockRejectedValue(
        new Error("Delete failed"),
      );

      await expect(
        (DELETE as any)({
          supabase: {},
          orgId,
          params: { customerId, commId },
          user,
        }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
