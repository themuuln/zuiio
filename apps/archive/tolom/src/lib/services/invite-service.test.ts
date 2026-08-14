import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { cancelInvite, resendInvite } from "./invite-service";

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));

describe("invite-service", () => {
  const rawClient = createMockSupabaseClient();
  const db = rawClient as unknown as SupabaseClient;

  describe("cancelInvite", () => {
    it("scopes cancellation to the organization and pending status", async () => {
      rawClient.from("org_invites").maybeSingle.mockResolvedValueOnce({
        data: { id: "invite-1" },
        error: null,
      });

      await cancelInvite(db, "org-1", "invite-1");

      expect(rawClient.from).toHaveBeenCalledWith("org_invites");
      expect(rawClient.from("org_invites").eq).toHaveBeenCalledWith(
        "organization_id",
        "org-1",
      );
      expect(rawClient.from("org_invites").eq).toHaveBeenCalledWith(
        "status",
        "pending",
      );
    });

    it("throws when the pending invite is not found in the organization", async () => {
      rawClient.from("org_invites").maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        cancelInvite(db, "org-1", "invite-404"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("resendInvite", () => {
    it("scopes resend to the organization and pending status", async () => {
      rawClient.from("org_invites").maybeSingle.mockResolvedValueOnce({
        data: { id: "invite-1" },
        error: null,
      });

      await resendInvite(db, "org-1", "invite-1");

      expect(rawClient.from).toHaveBeenCalledWith("org_invites");
      expect(rawClient.from("org_invites").eq).toHaveBeenCalledWith(
        "organization_id",
        "org-1",
      );
      expect(rawClient.from("org_invites").eq).toHaveBeenCalledWith(
        "status",
        "pending",
      );
    });

    it("throws when the pending invite is not found in the organization", async () => {
      rawClient.from("org_invites").maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        resendInvite(db, "org-1", "invite-404"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
