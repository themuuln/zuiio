import { describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createAttachment,
  deleteAttachment,
  getAttachments,
} from "./attachment-service";

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("attachment-service", () => {
  describe("getAttachments", () => {
    it("returns an array of attachments", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.__qb.resolveWith({
        data: [
          {
            id: "att-1",
            organization_id: "org-1",
            work_order_id: "wo-1",
            file_name: "photo.jpg",
            file_size: 1024,
            mime_type: "image/jpeg",
            storage_path: "/uploads/photo.jpg",
            public_url: null,
            file_type: "photo",
            uploaded_by: "user-1",
            created_at: "2026-06-01T00:00:00Z",
            deleted_at: null,
          },
        ],
        error: null,
      });

      const result = await getAttachments(db, "org-1", "wo-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createAttachment", () => {
    it("creates and returns an attachment", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("work_order_attachments").single.mockResolvedValue({
        data: {
          id: "att-1",
          organization_id: "org-1",
          work_order_id: "wo-1",
          file_name: "photo.jpg",
          file_size: 1024,
          mime_type: "image/jpeg",
          storage_path: "/uploads/photo.jpg",
          public_url: null,
          file_type: "photo",
          uploaded_by: "user-1",
          created_at: "2026-06-01T00:00:00Z",
          deleted_at: null,
        },
        error: null,
      });

      const result = await createAttachment(db, "org-1", "wo-1", {
        file_name: "photo.jpg",
        file_size: 1024,
        mime_type: "image/jpeg",
        storage_path: "/uploads/photo.jpg",
        file_type: "photo",
      });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("file_name");
    });
  });

  describe("deleteAttachment", () => {
    it("soft-deletes an attachment", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("work_order_attachments").single.mockResolvedValue({
        data: { id: "att-1" },
        error: null,
      });

      await expect(
        deleteAttachment(db, "org-1", "wo-1", "att-1"),
      ).resolves.toBeUndefined();
    });
  });
});
