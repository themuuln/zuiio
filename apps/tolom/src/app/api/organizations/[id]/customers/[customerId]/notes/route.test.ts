import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getCustomerNotesMock = vi.fn();
const createCustomerNoteMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/customer-note-service", () => ({
  getCustomerNotes: getCustomerNotesMock,
  createCustomerNote: createCustomerNoteMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/customers/[customerId]/notes route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ─────────────────────────────────────────────

  describe("GET", () => {
    it("returns customer notes successfully", async () => {
      const notes = [
        { id: "note-1", content: "Follow up on invoice", type: "general" },
        { id: "note-2", content: "Customer prefers email", type: "general" },
      ];
      getCustomerNotesMock.mockResolvedValue(notes);

      const response = await (GET as any)({
        supabase: {},
        orgId,
        params: { customerId },
      });
      const body = await response.json();

      expect(body.data).toEqual(notes);
      expect(response.status).toBe(200);
      expect(getCustomerNotesMock).toHaveBeenCalledTimes(1);
      expect(getCustomerNotesMock).toHaveBeenCalledWith({}, orgId, customerId);
    });

    it("handles service error", async () => {
      getCustomerNotesMock.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        (GET as any)({ supabase: {}, orgId, params: { customerId } }),
      ).rejects.toThrow("DB connection failed");

      expect(getCustomerNotesMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST ────────────────────────────────────────────

  describe("POST", () => {
    it("creates a customer note and returns 201", async () => {
      const body = { content: "New note", type: "general" };
      const createdNote = { id: "note-3", ...body, customer_id: customerId };
      createCustomerNoteMock.mockResolvedValue(createdNote);

      const request = { json: vi.fn().mockResolvedValue(body) };

      const response = await (POST as any)({
        supabase: {},
        orgId,
        params: { customerId },
        request,
        user,
      });
      const result = await response.json();

      expect(result.data).toEqual(createdNote);
      expect(response.status).toBe(201);
      expect(createCustomerNoteMock).toHaveBeenCalledTimes(1);
      expect(createCustomerNoteMock).toHaveBeenCalledWith(
        {},
        orgId,
        customerId,
        body,
        user.id,
      );
    });

    it("handles service error", async () => {
      const body = { content: "Failing note" };
      createCustomerNoteMock.mockRejectedValue(
        new Error("Failed to create note"),
      );

      const request = { json: vi.fn().mockResolvedValue(body) };

      await expect(
        (POST as any)({
          supabase: {},
          orgId,
          params: { customerId },
          request,
          user,
        }),
      ).rejects.toThrow("Failed to create note");

      expect(createCustomerNoteMock).toHaveBeenCalledTimes(1);
    });
  });
});
