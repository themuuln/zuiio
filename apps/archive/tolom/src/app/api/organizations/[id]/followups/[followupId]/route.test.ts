import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getFollowupMock = vi.fn();
const completeFollowupMock = vi.fn();
const cancelFollowupMock = vi.fn();
const updateFollowupMock = vi.fn();
const deleteFollowupMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/followup-service", () => ({
  cancelFollowup: cancelFollowupMock,
  completeFollowup: completeFollowupMock,
  deleteFollowup: deleteFollowupMock,
  getFollowup: getFollowupMock,
  updateFollowup: updateFollowupMock,
}));

const { DELETE, GET, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/followups/[followupId] route", () => {
  const orgId = "org-1";
  const followupId = "fup-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/followups/${followupId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns follow-up on success", async () => {
      const followup = {
        id: followupId,
        organization_id: orgId,
        title: "Follow up on estimate",
        status: "pending",
      };
      getFollowupMock.mockResolvedValue(followup);

      const params = { followupId };
      const response = await (GET as any)({ orgId, params, supabase: {} });
      const body = await response.json();

      expect(getFollowupMock).toHaveBeenCalledWith({}, followupId, orgId);
      expect(body.data).toEqual(followup);
      expect(response.status).toBe(200);
    });

    it("returns 404 when follow-up not found", async () => {
      getFollowupMock.mockResolvedValue(null);

      const params = { followupId };
      const response = await (GET as any)({ orgId, params, supabase: {} });

      expect(getFollowupMock).toHaveBeenCalledWith({}, followupId, orgId);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
      expect(body.error.message).toBe("Follow-up not found");
    });

    it("handles service error", async () => {
      getFollowupMock.mockRejectedValue(new Error("DB error"));

      const params = { followupId };
      await expect(
        (GET as any)({ orgId, params, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("complete action success", async () => {
      const followup = {
        id: followupId,
        organization_id: orgId,
        status: "completed",
        outcome: "resolved",
        outcome_notes: "Customer agreed to proceed",
      };
      completeFollowupMock.mockResolvedValue(followup);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({
          action: "complete",
          outcome: "resolved",
          outcome_notes: "Customer agreed to proceed",
        }),
        headers: { "content-type": "application/json" },
      });
      const params = { followupId };
      const response = await (PATCH as any)({
        request,
        orgId,
        params,
        supabase: {},
      });
      const body = await response.json();

      expect(completeFollowupMock).toHaveBeenCalledWith(
        {},
        followupId,
        orgId,
        "resolved",
        "Customer agreed to proceed",
      );
      expect(body.data).toEqual(followup);
      expect(response.status).toBe(200);
    });

    it("cancel action success", async () => {
      const followup = {
        id: followupId,
        organization_id: orgId,
        status: "cancelled",
      };
      cancelFollowupMock.mockResolvedValue(followup);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
        headers: { "content-type": "application/json" },
      });
      const params = { followupId };
      const response = await (PATCH as any)({
        request,
        orgId,
        params,
        supabase: {},
      });
      const body = await response.json();

      expect(cancelFollowupMock).toHaveBeenCalledWith({}, followupId, orgId);
      expect(body.data).toEqual(followup);
      expect(response.status).toBe(200);
    });

    it("update action success", async () => {
      const followup = {
        id: followupId,
        organization_id: orgId,
        title: "Updated title",
        notes: "Some notes",
      };
      updateFollowupMock.mockResolvedValue(followup);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated title", notes: "Some notes" }),
        headers: { "content-type": "application/json" },
      });
      const params = { followupId };
      const response = await (PATCH as any)({
        request,
        orgId,
        params,
        supabase: {},
      });
      const body = await response.json();

      expect(updateFollowupMock).toHaveBeenCalledWith({}, followupId, orgId, {
        title: "Updated title",
        notes: "Some notes",
      });
      expect(body.data).toEqual(followup);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      completeFollowupMock.mockRejectedValue(new Error("Complete failed"));

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "complete", outcome: "resolved" }),
        headers: { "content-type": "application/json" },
      });
      const params = { followupId };
      await expect(
        (PATCH as any)({ request, orgId, params, supabase: {} }),
      ).rejects.toThrow("Complete failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes follow-up on success", async () => {
      deleteFollowupMock.mockResolvedValue(undefined);

      const params = { followupId };
      const response = await (DELETE as any)({ orgId, params, supabase: {} });
      const body = await response.json();

      expect(deleteFollowupMock).toHaveBeenCalledWith({}, followupId, orgId);
      expect(body.data).toEqual({ deleted: true });
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      deleteFollowupMock.mockRejectedValue(new Error("Delete failed"));

      const params = { followupId };
      await expect(
        (DELETE as any)({ orgId, params, supabase: {} }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
