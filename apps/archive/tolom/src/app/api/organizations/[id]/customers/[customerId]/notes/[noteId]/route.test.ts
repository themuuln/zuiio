import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteCustomerNoteMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/customer-note-service", () => ({
  deleteCustomerNote: deleteCustomerNoteMock,
}));

const { DELETE } = await import("./route");

describe("organizations/[id]/customers/[customerId]/notes/[noteId] route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";
  const noteId = "note-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("deletes note and returns ok(null)", async () => {
      deleteCustomerNoteMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        supabase: {},
        orgId,
        params: { customerId, noteId },
        user,
      });
      const body = await response.json();

      expect(deleteCustomerNoteMock).toHaveBeenCalledWith(
        {},
        orgId,
        customerId,
        noteId,
        user.id,
      );
      expect(body.data).toBeNull();
    });

    it("handles service error", async () => {
      deleteCustomerNoteMock.mockRejectedValue(new Error("Delete failed"));

      await expect(
        (DELETE as any)({
          supabase: {},
          orgId,
          params: { customerId, noteId },
          user,
        }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
