/**
 * updateOrgHardwareSetting — org ESC/POS printer config. Covers the port
 * validation, empty-host clearing, and the organizations UPDATE call.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
  withDbCapture: vi.fn(
    (
      _label: string,
      query: { then: (r: (v: unknown) => unknown) => unknown },
    ) => query.then((v: unknown) => v),
  ),
}));

const mockRequireActionContext = vi.fn();
vi.mock("@/lib/action-utils", () => ({
  requireActionContext: mockRequireActionContext,
}));

const mockRevalidate = vi.fn();
vi.mock("@/lib/revalidate", () => ({
  revalidateEntity: mockRevalidate,
}));

const ORG_ID = "org-123";

/** Chainable supabase stub: from().update(payload).eq(col, value). */
function makeSupabase(result: { error?: Error | null }) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue(result),
  });
  const supabase = {
    from: vi.fn().mockReturnValue({ update }),
  };
  return { supabase, update };
}

function authedCtx(supabase: unknown) {
  return {
    organizationId: ORG_ID,
    userId: "user-456",
    permissions: ["settings.manage"],
    supabase,
  };
}

beforeEach(() => {
  vi.resetModules();
  mockCapture.mockClear();
  mockRevalidate.mockClear();
  mockRequireActionContext.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateOrgHardwareSetting", () => {
  it("saves the host and port when valid", async () => {
    const { supabase, update } = makeSupabase({ error: null });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const { updateOrgHardwareSetting } = await import("../actions");
    const formData = new FormData();
    formData.set("escpos_host", " 10.0.0.5 ");
    formData.set("escpos_port", "9100");

    const result = await updateOrgHardwareSetting(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith({
      escpos_host: "10.0.0.5",
      escpos_port: 9100,
    });
    expect(mockRevalidate).toHaveBeenCalledWith("settings");
  });

  it("defaults the port to 9100 and clears an empty host", async () => {
    const { supabase, update } = makeSupabase({ error: null });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const { updateOrgHardwareSetting } = await import("../actions");
    const formData = new FormData();

    const result = await updateOrgHardwareSetting(undefined, formData);

    expect(result).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith({
      escpos_host: null,
      escpos_port: 9100,
    });
  });

  it("rejects an out-of-range port without touching the DB", async () => {
    const { supabase, update } = makeSupabase({ error: null });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const { updateOrgHardwareSetting } = await import("../actions");
    for (const bad of ["0", "65536", "9100.5", "-1", "abc"]) {
      const formData = new FormData();
      formData.set("escpos_host", "10.0.0.5");
      formData.set("escpos_port", bad);
      const result = await updateOrgHardwareSetting(undefined, formData);
      expect(result).toEqual({ error: "Портын дугаар буруу байна." });
      expect(update).not.toHaveBeenCalled();
      update.mockClear();
    }
  });

  it("returns the context error when unauthorized", async () => {
    mockRequireActionContext.mockResolvedValue({ error: "Хандах эрхгүй" });

    const { updateOrgHardwareSetting } = await import("../actions");
    const formData = new FormData();
    formData.set("escpos_host", "10.0.0.5");

    expect(await updateOrgHardwareSetting(undefined, formData)).toEqual({
      error: "Хандах эрхгүй",
    });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("captures and surfaces a DB error", async () => {
    const dbError = new Error("network failure");
    const { supabase, update } = makeSupabase({ error: dbError });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const { updateOrgHardwareSetting } = await import("../actions");
    const formData = new FormData();
    formData.set("escpos_host", "10.0.0.5");
    formData.set("escpos_port", "9100");

    const result = await updateOrgHardwareSetting(undefined, formData);

    expect(result).toEqual({
      error: "Хадгалахад алдаа гарлаа: network failure",
    });
    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "updateOrgHardwareSetting",
    });
    expect(update).toHaveBeenCalled();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
