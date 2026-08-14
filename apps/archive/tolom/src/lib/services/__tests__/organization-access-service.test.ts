import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

import {
  activateOrganizationAccess,
  listUserOrganizations,
} from "../organization-access-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── listUserOrganizations ─────────────────────────────────────────

describe("listUserOrganizations", () => {
  const orgRows = [
    {
      organization_id: ORG_ID,
      name: "Test Org",
      slug: "test-org",
      branch_id: "branch-1",
      role_id: "role-1",
      is_primary: true,
      has_bay_view_pin: false,
    },
    {
      organization_id: "org-2",
      name: "Second Org",
      slug: "second-org",
      branch_id: null,
      role_id: null,
      is_primary: false,
      has_bay_view_pin: true,
    },
  ];

  it("returns list of organizations when userId is provided", async () => {
    db.rpc = vi.fn().mockResolvedValue({ data: orgRows, error: null });

    const result = await listUserOrganizations(db as never, USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0].organizationId).toBe(ORG_ID);
    expect(result[0].name).toBe("Test Org");
    expect(result[0].slug).toBe("test-org");
    expect(result[0].branchId).toBe("branch-1");
    expect(result[0].isPrimary).toBe(true);
    expect(result[0].hasBayViewPin).toBe(false);
    expect(result[1].hasBayViewPin).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith("get_user_organizations");
  });

  it("fetches auth user when userId is not provided", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: { id: "auth-user" } },
      error: null,
    });
    db.rpc = vi.fn().mockResolvedValue({ data: orgRows, error: null });

    const result = await listUserOrganizations(db as never);

    expect(result).toHaveLength(2);
    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("throws UnauthorizedError when no user is found", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(listUserOrganizations(db as never)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("throws UnauthorizedError on RPC error", async () => {
    db.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("RPC failed"),
    });

    await expect(listUserOrganizations(db as never, USER_ID)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("returns empty array when RPC returns null data", async () => {
    db.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await listUserOrganizations(db as never, USER_ID);

    expect(result).toEqual([]);
  });
});

// ── activateOrganizationAccess ────────────────────────────────────

describe("activateOrganizationAccess", () => {
  const orgRows = [
    {
      organization_id: ORG_ID,
      name: "Test Org",
      slug: "test-org",
      branch_id: "branch-1",
      role_id: "role-1",
      is_primary: false,
      has_bay_view_pin: false,
    },
  ];

  beforeEach(() => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("activates organization access with new PIN", async () => {
    db.rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: orgRows, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await activateOrganizationAccess(db as never, {
      organizationId: ORG_ID,
      pin: "1234",
      confirmPin: "1234",
    });

    expect(db.rpc).toHaveBeenCalledWith("set_organization_bay_view_pin", {
      target_org_id: ORG_ID,
      plain_pin: "1234",
    });
    expect(db.rpc).toHaveBeenCalledWith("set_primary_organization", {
      target_org_id: ORG_ID,
    });
  });

  it("verifies the bay view pin when org already has one", async () => {
    const orgWithPin = [{ ...orgRows[0], has_bay_view_pin: true }];
    db.rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: orgWithPin, error: null })
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await activateOrganizationAccess(db as never, {
      organizationId: ORG_ID,
      pin: "1234",
    });

    expect(db.rpc).not.toHaveBeenCalledWith(
      "set_organization_bay_view_pin",
      expect.anything(),
    );
    expect(db.rpc).toHaveBeenCalledWith("verify_organization_bay_view_pin", {
      target_org_id: ORG_ID,
      plain_pin: "1234",
    });
    expect(db.rpc).toHaveBeenCalledWith("set_primary_organization", {
      target_org_id: ORG_ID,
    });
  });

  it("throws ValidationError when org pin verification fails", async () => {
    const orgWithPin = [{ ...orgRows[0], has_bay_view_pin: true }];
    db.rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: orgWithPin, error: null })
      .mockResolvedValueOnce({ data: false, error: null });

    await expect(
      activateOrganizationAccess(db as never, {
        organizationId: ORG_ID,
        pin: "9999",
      }),
    ).rejects.toThrow(ValidationError);
    expect(db.rpc).not.toHaveBeenCalledWith(
      "set_primary_organization",
      expect.anything(),
    );
  });

  it("throws UnauthorizedError when org is not in user's list", async () => {
    db.rpc = vi.fn().mockResolvedValueOnce({ data: orgRows, error: null });

    await expect(
      activateOrganizationAccess(db as never, {
        organizationId: "unknown-org",
        pin: "1234",
        confirmPin: "1234",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("throws ValidationError when PIN is not 4-6 digits", async () => {
    db.rpc = vi.fn().mockResolvedValueOnce({ data: orgRows, error: null });

    await expect(
      activateOrganizationAccess(db as never, {
        organizationId: ORG_ID,
        pin: "123",
        confirmPin: "123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when PIN confirmation does not match", async () => {
    db.rpc = vi.fn().mockResolvedValueOnce({ data: orgRows, error: null });

    await expect(
      activateOrganizationAccess(db as never, {
        organizationId: ORG_ID,
        pin: "1234",
        confirmPin: "5678",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when set_primary_organization RPC fails", async () => {
    db.rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: orgRows, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("RPC failed") });

    await expect(
      activateOrganizationAccess(db as never, {
        organizationId: ORG_ID,
        pin: "1234",
        confirmPin: "1234",
      }),
    ).rejects.toThrow(ValidationError);
  });
});
