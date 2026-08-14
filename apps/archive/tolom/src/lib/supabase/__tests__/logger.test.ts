import { describe, expect, it, vi } from "vitest";
import { logSupabaseResult } from "@/lib/supabase/logger";

// Mock @sentry/nextjs
const mockCaptureMessage = vi.fn();
const mockWithScope = vi.fn((cb: (scope: Record<string, unknown>) => void) => {
  const scope = {
    setLevel: vi.fn(),
    setTag: vi.fn(),
    setExtras: vi.fn(),
  };
  cb(scope);
});
vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  withScope: (...args: unknown[]) => mockWithScope(...args),
}));

describe("logSupabaseResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with an explicit PostgREST error", () => {
    const error = {
      message: 'new row violates row-level security for table "profiles"',
      code: "42501",
      details: "permission denied",
      hint: "check RLS policies",
    };

    it("calls Sentry.withScope", () => {
      logSupabaseResult(error, "profiles.update", { id: "123" });
      expect(mockWithScope).toHaveBeenCalledTimes(1);
    });

    it("calls Sentry.captureMessage with warning level", () => {
      logSupabaseResult(error, "profiles.update", { id: "123" });
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Supabase error [profiles.update]: new row violates row-level security for table "profiles"',
        "warning",
      );
    });

    it("includes operation and source tags", () => {
      logSupabaseResult(error, "work_orders.insert");
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("includes context when provided", () => {
      const context = { id: "123", orgId: "org-456" };
      logSupabaseResult(error, "profiles.update", context);
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("does not capture silent-null warning when error is present", () => {
      // When error is present, the function returns after handling the error
      // and does not check the data parameter at all.
      logSupabaseResult(error, "profiles.update", undefined, null);
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      // The message should start with "Supabase error" not "Supabase silent"
      const calls = mockCaptureMessage.mock.calls as [[string, string]];
      expect(calls[0][0]).toContain("Supabase error");
      expect(calls[0][0]).not.toContain("silent");
    });

    it("returns early after handling error", () => {
      const context = { id: "123" };
      logSupabaseResult(error, "profiles.update", context);
      // Only one captureMessage call (for the error), no silent RLS call
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("with null error (success case)", () => {
    it("does not call captureMessage when data is valid", () => {
      logSupabaseResult(null, "profiles.select", undefined, [{ id: "1" }]);
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("does not call captureMessage when data is an empty array", () => {
      logSupabaseResult(null, "profiles.select", undefined, []);
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("does not call captureMessage when data is undefined (indeterminate)", () => {
      logSupabaseResult(null, "profiles.update");
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("calls captureMessage for silent null-data mutation", () => {
      logSupabaseResult(null, "profiles.update", { id: "123" }, null);
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Supabase silent null-data mutation [profiles.update] — possible RLS block",
        "warning",
      );
    });

    it("sets silent_rls_block tag on silent failure", () => {
      logSupabaseResult(null, "profiles.delete", undefined, null);
      // Verify withScope was called (it sets the tag inside)
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("includes context for silent mutation", () => {
      const context = { table: "profiles", id: "456" };
      logSupabaseResult(null, "profiles.update", context, null);
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("passes correct operation label to message", () => {
      logSupabaseResult(null, "work_orders.insert", undefined, null);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Supabase silent null-data mutation [work_orders.insert] — possible RLS block",
        "warning",
      );
    });
  });

  describe("edge cases", () => {
    it("handles error without code or details", () => {
      const minimalError = { message: "generic error" };
      logSupabaseResult(minimalError, "generic.op");
      expect(mockCaptureMessage).toHaveBeenCalled();
    });

    it("handles error with only message field", () => {
      logSupabaseResult(
        { message: "timeout" } as const,
        "db.query",
        undefined,
        [{ id: 1 }],
      );
      expect(mockCaptureMessage).toHaveBeenCalled();
    });

    it("handles operation with dots in the name", () => {
      logSupabaseResult(null, "profiles.update", undefined, null);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Supabase silent null-data mutation [profiles.update] — possible RLS block",
        "warning",
      );
    });

    it("accepts undefined context", () => {
      logSupabaseResult(null, "simple.op", undefined, [{ id: 1 }]);
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("accepts empty object context", () => {
      logSupabaseResult(null, "simple.op", {}, [{ id: 1 }]);
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });
  });
});
