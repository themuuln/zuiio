import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Module mocks (server action deps) ──────────────────────────

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
  withDbCapture: async (_label: unknown, promise: Promise<unknown>) => promise,
}));

vi.mock("@/lib/action-utils", () => ({
  requireWriteAction: vi.fn(),
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateEntities: vi.fn(),
}));

import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";
import { applyDashboardTemplate } from "../actions";

const ORG_ID = "org-1";

function makeSupabaseMock() {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const from = vi.fn(() => ({ update }));
  return { supabase: { from } as never, update, updateEq, from };
}

function makeFormData(templateId: string): FormData {
  const fd = new FormData();
  fd.set("dashboard_template", templateId);
  return fd;
}

function makeCtx(supabase: unknown) {
  return {
    supabase,
    organizationId: ORG_ID,
    userId: "user-1",
    branchId: "branch-1",
    roleId: null,
    permissions: ["settings.update"],
    isBranchScoped: false,
    user: { id: "user-1", email: "admin@example.com" },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applyDashboardTemplate", () => {
  it("updates organizations.dashboard_template and revalidates on happy path", async () => {
    const mocks = makeSupabaseMock();
    vi.mocked(requireWriteAction).mockResolvedValue(
      makeCtx(mocks.supabase) as never,
    );

    const result = await applyDashboardTemplate(
      undefined,
      makeFormData("retail"),
    );

    expect(result).toEqual({ success: true });
    expect(mocks.from).toHaveBeenCalledWith("organizations");
    expect(mocks.update).toHaveBeenCalledWith({
      dashboard_template: "retail",
    });
    expect(mocks.updateEq).toHaveBeenCalledWith("id", ORG_ID);
    expect(revalidateEntities).toHaveBeenCalledWith(["settings", "dashboard"]);
  });

  it("rejects an invalid template id without touching the database", async () => {
    const mocks = makeSupabaseMock();
    vi.mocked(requireWriteAction).mockResolvedValue(
      makeCtx(mocks.supabase) as never,
    );

    const result = await applyDashboardTemplate(
      undefined,
      makeFormData("hacker-template"),
    );

    expect(result.error).toBeDefined();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(revalidateEntities).not.toHaveBeenCalled();
  });

  it("returns an error when the user is unauthorized", async () => {
    vi.mocked(requireWriteAction).mockResolvedValue({
      error: "Танд энэ үйлдлийг хийх эрх байхгүй.",
    } as never);

    const result = await applyDashboardTemplate(
      undefined,
      makeFormData("default"),
    );

    expect(result.error).toBeDefined();
  });

  it("surfaces supabase update errors", async () => {
    const mocks = makeSupabaseMock();
    mocks.updateEq.mockResolvedValue({ error: new Error("db down") });
    vi.mocked(requireWriteAction).mockResolvedValue(
      makeCtx(mocks.supabase) as never,
    );

    const result = await applyDashboardTemplate(
      undefined,
      makeFormData("financial"),
    );

    expect(result.error).toContain("db down");
    expect(result.success).toBeUndefined();
  });
});
