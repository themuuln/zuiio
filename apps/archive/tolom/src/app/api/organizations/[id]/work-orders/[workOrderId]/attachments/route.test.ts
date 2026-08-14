import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getAttachmentsMock = vi.fn();
const createAttachmentMock = vi.fn();
const deleteAttachmentMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
  created: vi.fn(
    (data) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/attachment-service", () => ({
  getAttachments: getAttachmentsMock,
  createAttachment: createAttachmentMock,
  deleteAttachment: deleteAttachmentMock,
}));

vi.mock("@/lib/validation/work-orders", () => ({
  parseBody: vi.fn().mockImplementation(async (request: Request) => {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  }),
  createAttachmentSchema: {},
}));

const { GET, POST, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/attachments route", () => {
  const orgId = "org-1";
  const workOrderId = "00000000-0000-0000-0000-000000000000";
  const params = { workOrderId };
  const baseUrl = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/attachments`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────────────

  describe("GET", () => {
    it("returns attachments on success", async () => {
      const attachments = [{ id: "att-1", file_name: "doc.pdf" }];
      getAttachmentsMock.mockResolvedValue(attachments);

      const response = await (GET as any)({ params, orgId, supabase: {} });
      const body = await response.json();

      expect(getAttachmentsMock).toHaveBeenCalledWith({}, orgId, workOrderId);
      expect(body.data).toEqual(attachments);
      expect(response.status).toBe(200);
    });

    it("returns 400 for invalid work order UUID", async () => {
      const response = await (GET as any)({
        params: { workOrderId: "not-a-uuid" },
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(response.status).toBe(400);
      expect(getAttachmentsMock).not.toHaveBeenCalled();
    });

    it("handles service error", async () => {
      getAttachmentsMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ params, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── POST ──────────────────────────────────────────────────

  describe("POST", () => {
    it("creates an attachment on success", async () => {
      const attachment = { id: "att-1", file_name: "photo.jpg" };
      createAttachmentMock.mockResolvedValue(attachment);
      const body = {
        file_name: "photo.jpg",
        file_size: 1024,
        mime_type: "image/jpeg",
        storage_path: "uploads/org-1/photo.jpg",
        file_type: "photo" as const,
      };

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        params,
        orgId,
        supabase: {},
        user: { id: "user-1" },
      });
      const data = await response.json();

      expect(createAttachmentMock).toHaveBeenCalledWith(
        {},
        orgId,
        workOrderId,
        body,
        "user-1",
      );
      expect(data.data).toEqual(attachment);
      expect(response.status).toBe(201);
    });

    it("returns validation error when parseBody throws", async () => {
      const { parseBody: mockParseBody } = await import(
        "@/lib/validation/work-orders"
      );
      mockParseBody.mockRejectedValueOnce(new Error("Validation failed"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: "invalid",
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          request,
          params,
          orgId,
          supabase: {},
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("Validation failed");
    });

    it("handles service error on create", async () => {
      createAttachmentMock.mockRejectedValue(new Error("Create failed"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ file_name: "test.jpg" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          request,
          params,
          orgId,
          supabase: {},
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("Create failed");
    });
  });

  // ── DELETE ────────────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes an attachment on success", async () => {
      deleteAttachmentMock.mockResolvedValue(undefined);

      const request = new NextRequest(`${baseUrl}?attachmentId=att-1`, {
        method: "DELETE",
      });
      const response = await (DELETE as any)({
        request,
        params,
        orgId,
        supabase: {},
        user: { id: "user-1" },
      });
      const data = await response.json();

      expect(deleteAttachmentMock).toHaveBeenCalledWith(
        {},
        orgId,
        workOrderId,
        "att-1",
        "user-1",
      );
      expect(data.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns 400 when attachmentId is missing", async () => {
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      const response = await (DELETE as any)({
        request,
        params,
        orgId,
        supabase: {},
        user: { id: "user-1" },
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(response.status).toBe(400);
      expect(deleteAttachmentMock).not.toHaveBeenCalled();
    });

    it("handles service error on delete", async () => {
      deleteAttachmentMock.mockRejectedValue(new Error("Delete failed"));

      const request = new NextRequest(`${baseUrl}?attachmentId=att-1`, {
        method: "DELETE",
      });
      await expect(
        (DELETE as any)({
          request,
          params,
          orgId,
          supabase: {},
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
