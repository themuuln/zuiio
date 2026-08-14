import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Service Mocks ──────────────────────────────────────────────

const createSessionMock = vi.fn();
const listSessionsMock = vi.fn();
const getSessionMock = vi.fn();
const reconcileSessionMock = vi.fn();
const cancelSessionMock = vi.fn();
const addCountItemMock = vi.fn();
const removeCountItemMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/stock-count-service", () => ({
  createSession: createSessionMock,
  listSessions: listSessionsMock,
  getSession: getSessionMock,
  reconcileSession: reconcileSessionMock,
  cancelSession: cancelSessionMock,
  addCountItem: addCountItemMock,
  removeCountItem: removeCountItemMock,
}));

// ── Route Imports ──────────────────────────────────────────────

const sessionsModule = await import("../sessions/route");
const sessionDetailModule = await import("../sessions/[sessionId]/route");
const itemsModule = await import("../sessions/[sessionId]/items/route");

const { GET: GET_SESSIONS, POST: POST_SESSION } = sessionsModule;
const { GET: GET_SESSION, PATCH: PATCH_SESSION } = sessionDetailModule;
const { POST: POST_ITEM, DELETE: DELETE_ITEM } = itemsModule;

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/stock-counts", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const sessionId = "session-1";
  const itemId = "item-1";
  const partId = "part-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Sessions List (GET / POST) ────────────────────────────

  describe("sessions/route.ts", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/stock-counts/sessions`;

    describe("GET", () => {
      it("returns sessions with default limit when no params", async () => {
        listSessionsMock.mockResolvedValue([
          { id: "s-1", status: "in_progress", total_items: 5 },
        ]);

        const request = new NextRequest(baseUrl);
        const response = await (GET_SESSIONS as any)({
          supabase: {},
          orgId,
          request,
        });
        const body = await response.json();

        expect(listSessionsMock).toHaveBeenCalledWith({}, orgId, undefined, 20);
        expect(body.data).toEqual([
          { id: "s-1", status: "in_progress", total_items: 5 },
        ]);
      });

      it("filters by status", async () => {
        listSessionsMock.mockResolvedValue([
          { id: "s-2", status: "completed" },
        ]);

        const request = new NextRequest(`${baseUrl}?status=completed`);
        const response = await (GET_SESSIONS as any)({
          supabase: {},
          orgId,
          request,
        });
        const body = await response.json();

        expect(listSessionsMock).toHaveBeenCalledWith(
          {},
          orgId,
          "completed",
          20,
        );
        expect(body.data).toEqual([{ id: "s-2", status: "completed" }]);
      });

      it("honors a custom limit", async () => {
        listSessionsMock.mockResolvedValue([
          { id: "s-3" },
          { id: "s-4" },
          { id: "s-5" },
        ]);

        const request = new NextRequest(`${baseUrl}?limit=5`);
        const response = await (GET_SESSIONS as any)({
          supabase: {},
          orgId,
          request,
        });
        const body = await response.json();

        expect(listSessionsMock).toHaveBeenCalledWith({}, orgId, undefined, 5);
        expect(body.data).toHaveLength(3);
      });

      it("handles service error", async () => {
        listSessionsMock.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest(baseUrl);
        await expect(
          (GET_SESSIONS as any)({ supabase: {}, orgId, request }),
        ).rejects.toThrow("DB error");
      });
    });

    describe("POST", () => {
      it("creates a session with branchId and notes", async () => {
        createSessionMock.mockResolvedValue({
          id: "s-1",
          status: "in_progress",
          total_items: 0,
        });

        const body = { branchId: "branch-1", notes: "Monthly count" };
        const request = new NextRequest(baseUrl, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        });
        const response = await (POST_SESSION as any)({
          supabase: {},
          orgId,
          request,
          user,
        });
        const data = await response.json();

        expect(createSessionMock).toHaveBeenCalledWith(
          {},
          orgId,
          user.id,
          "branch-1",
          "Monthly count",
        );
        expect(data.data).toEqual({
          id: "s-1",
          status: "in_progress",
          total_items: 0,
        });
        expect(response.status).toBe(201);
      });

      it("creates a session without optional fields", async () => {
        createSessionMock.mockResolvedValue({
          id: "s-2",
          status: "in_progress",
        });

        const request = new NextRequest(baseUrl, {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "content-type": "application/json" },
        });
        const response = await (POST_SESSION as any)({
          supabase: {},
          orgId,
          request,
          user,
        });
        await response.json();

        expect(createSessionMock).toHaveBeenCalledWith(
          {},
          orgId,
          user.id,
          null,
          null,
        );
      });

      it("handles service error on create", async () => {
        createSessionMock.mockRejectedValue(new Error("Org not found"));

        const request = new NextRequest(baseUrl, {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "content-type": "application/json" },
        });
        await expect(
          (POST_SESSION as any)({ supabase: {}, orgId, request, user }),
        ).rejects.toThrow("Org not found");
      });
    });
  });

  // ── Session Detail (GET / PATCH) ──────────────────────────

  describe("sessions/[sessionId]/route.ts", () => {
    const detailUrl = `${orgId}/inventory/stock-counts/sessions/${sessionId}`;

    describe("GET", () => {
      it("returns session by id with items", async () => {
        getSessionMock.mockResolvedValue({
          id: sessionId,
          status: "in_progress",
          items: [
            {
              id: "si-1",
              part_id: partId,
              physical_quantity: 10,
              system_quantity: 8,
            },
          ],
        });

        const request = new NextRequest(
          `http://localhost/api/organizations/${detailUrl}`,
        );
        const response = await (GET_SESSION as any)({
          supabase: {},
          params: { sessionId },
          request,
        });
        const body = await response.json();

        expect(getSessionMock).toHaveBeenCalledWith({}, sessionId);
        expect(body.data.id).toBe(sessionId);
        expect(body.data.items).toHaveLength(1);
      });

      it("handles not found error", async () => {
        getSessionMock.mockRejectedValue(new Error("Session not found"));

        const request = new NextRequest(
          `http://localhost/api/organizations/${detailUrl}`,
        );
        await expect(
          (GET_SESSION as any)({
            supabase: {},
            params: { sessionId },
            request,
          }),
        ).rejects.toThrow("Session not found");
      });
    });

    describe("PATCH", () => {
      const patchUrl = `http://localhost/api/organizations/${detailUrl}`;

      it("reconciles session when action is reconcile", async () => {
        reconcileSessionMock.mockResolvedValue({
          id: sessionId,
          status: "completed",
          movements_created: 3,
        });

        const request = new NextRequest(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ action: "reconcile" }),
          headers: { "content-type": "application/json" },
        });
        const response = await (PATCH_SESSION as any)({
          supabase: {},
          orgId,
          params: { sessionId },
          request,
          user,
        });
        const body = await response.json();

        expect(reconcileSessionMock).toHaveBeenCalledWith(
          {},
          orgId,
          sessionId,
          user.id,
        );
        expect(body.data.status).toBe("completed");
        expect(body.data.movements_created).toBe(3);
      });

      it("cancels session when action is cancel", async () => {
        cancelSessionMock.mockResolvedValue({
          id: sessionId,
          status: "cancelled",
        });

        const request = new NextRequest(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ action: "cancel" }),
          headers: { "content-type": "application/json" },
        });
        const response = await (PATCH_SESSION as any)({
          supabase: {},
          orgId,
          params: { sessionId },
          request,
          user,
        });
        const body = await response.json();

        expect(cancelSessionMock).toHaveBeenCalledWith({}, orgId, sessionId);
        expect(body.data.status).toBe("cancelled");
      });

      it("returns session for unknown action", async () => {
        getSessionMock.mockResolvedValue({
          id: sessionId,
          status: "in_progress",
        });

        const request = new NextRequest(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ action: "unknown_action" }),
          headers: { "content-type": "application/json" },
        });
        const response = await (PATCH_SESSION as any)({
          supabase: {},
          orgId,
          params: { sessionId },
          request,
          user,
        });
        const body = await response.json();

        expect(reconcileSessionMock).not.toHaveBeenCalled();
        expect(cancelSessionMock).not.toHaveBeenCalled();
        expect(getSessionMock).toHaveBeenCalledWith({}, sessionId);
        expect(body.data.id).toBe(sessionId);
      });

      it("handles reconcile error", async () => {
        reconcileSessionMock.mockRejectedValue(
          new Error("Session already completed"),
        );

        const request = new NextRequest(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ action: "reconcile" }),
          headers: { "content-type": "application/json" },
        });
        await expect(
          (PATCH_SESSION as any)({
            supabase: {},
            orgId,
            params: { sessionId },
            request,
            user,
          }),
        ).rejects.toThrow("Session already completed");
      });

      it("handles cancel error", async () => {
        cancelSessionMock.mockRejectedValue(
          new Error("Cannot cancel completed session"),
        );

        const request = new NextRequest(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ action: "cancel" }),
          headers: { "content-type": "application/json" },
        });
        await expect(
          (PATCH_SESSION as any)({
            supabase: {},
            orgId,
            params: { sessionId },
            request,
            user,
          }),
        ).rejects.toThrow("Cannot cancel completed session");
      });
    });
  });

  // ── Session Items (POST / DELETE) ─────────────────────────

  describe("sessions/[sessionId]/items/route.ts", () => {
    const itemsUrl = `http://localhost/api/organizations/${orgId}/inventory/stock-counts/sessions/${sessionId}/items`;

    describe("POST", () => {
      it("adds a count item with notes", async () => {
        addCountItemMock.mockResolvedValue({
          id: "si-1",
          part_id: partId,
          physical_quantity: 10,
          system_quantity: 8,
          variance: 2,
          notes: "Found extra",
        });

        const body = {
          part_id: partId,
          physical_quantity: 10,
          notes: "Found extra",
        };
        const request = new NextRequest(itemsUrl, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        });
        const response = await (POST_ITEM as any)({
          supabase: {},
          orgId,
          params: { sessionId },
          request,
        });
        const data = await response.json();

        expect(addCountItemMock).toHaveBeenCalledWith(
          {},
          orgId,
          sessionId,
          partId,
          10,
          "Found extra",
        );
        expect(data.data.variance).toBe(2);
        expect(response.status).toBe(201);
      });

      it("adds a count item without notes", async () => {
        addCountItemMock.mockResolvedValue({
          id: "si-2",
          part_id: partId,
          physical_quantity: 5,
          system_quantity: 5,
          variance: 0,
        });

        const body = { part_id: partId, physical_quantity: 5 };
        const request = new NextRequest(itemsUrl, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        });
        const response = await (POST_ITEM as any)({
          supabase: {},
          orgId,
          params: { sessionId },
          request,
        });
        await response.json();

        expect(addCountItemMock).toHaveBeenCalledWith(
          {},
          orgId,
          sessionId,
          partId,
          5,
          null,
        );
      });

      it("handles service error on add", async () => {
        addCountItemMock.mockRejectedValue(
          new Error("Part not found in inventory"),
        );

        const request = new NextRequest(itemsUrl, {
          method: "POST",
          body: JSON.stringify({ part_id: "invalid", physical_quantity: 1 }),
          headers: { "content-type": "application/json" },
        });
        await expect(
          (POST_ITEM as any)({
            supabase: {},
            orgId,
            params: { sessionId },
            request,
          }),
        ).rejects.toThrow("Part not found in inventory");
      });
    });

    describe("DELETE", () => {
      it("removes a count item", async () => {
        removeCountItemMock.mockResolvedValue(undefined);

        const request = new NextRequest(`${itemsUrl}?itemId=${itemId}`, {
          method: "DELETE",
        });
        const response = await (DELETE_ITEM as any)({
          supabase: {},
          orgId,
          request,
        });
        const body = await response.json();

        expect(removeCountItemMock).toHaveBeenCalledWith({}, orgId, itemId);
        expect(body.data).toBeUndefined();
      });

      it("handles service error on remove", async () => {
        removeCountItemMock.mockRejectedValue(
          new Error("Item not found in session"),
        );

        const request = new NextRequest(`${itemsUrl}?itemId=${itemId}`, {
          method: "DELETE",
        });
        await expect(
          (DELETE_ITEM as any)({
            supabase: {},
            orgId,
            request,
          }),
        ).rejects.toThrow("Item not found in session");
      });
    });
  });
});
