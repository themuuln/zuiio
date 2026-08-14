import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { activateOrganizationAccess } from "@/lib/services/organization-access-service";
import { createClient } from "@/lib/supabase/server";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  type CompleteOrganizationLoginState,
  completeOrganizationLogin,
} from "../actions/complete-organization-login";

vi.mock("@/lib/errors", () => {
  class AppError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AppError";
    }
  }
  return { AppError };
});
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/services/organization-access-service", () => ({
  activateOrganizationAccess: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockReportServerError = vi.mocked(reportServerError);
const mockActivateOrganizationAccess = vi.mocked(activateOrganizationAccess);
const mockCreateClient = vi.mocked(createClient);

const EMPTY_STATE: CompleteOrganizationLoginState = {};

let db: MockSupabaseClient;

function formWith(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("organizationId", "org-1");
  formData.set("pin", "1234");
  formData.set("confirmPin", "1234");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
});

describe("completeOrganizationLogin", () => {
  it("returns a form error when formData is not a FormData instance", async () => {
    const result = await completeOrganizationLogin(
      EMPTY_STATE,
      null as unknown as FormData,
    );

    expect(result).toEqual({ formError: "Invalid form submission" });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns a form error when formData lacks a get method", async () => {
    const result = await completeOrganizationLogin(EMPTY_STATE, {} as FormData);

    expect(result).toEqual({ formError: "Invalid form submission" });
  });

  it("returns a form error when no user is authenticated", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await completeOrganizationLogin(EMPTY_STATE, formWith());

    expect(result).toEqual({
      formError: "User not authenticated. Please sign in again.",
    });
    expect(mockActivateOrganizationAccess).not.toHaveBeenCalled();
  });

  it("returns field errors for an invalid PIN", async () => {
    const result = await completeOrganizationLogin(
      EMPTY_STATE,
      formWith({ pin: "ab12", confirmPin: "ab12" }),
    );

    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.pin).toBeDefined();
    expect(mockActivateOrganizationAccess).not.toHaveBeenCalled();
  });

  it("returns a field error when PINs do not match", async () => {
    const result = await completeOrganizationLogin(
      EMPTY_STATE,
      formWith({ confirmPin: "9999" }),
    );

    expect(result.fieldErrors?.confirmPin).toBeDefined();
    expect(mockActivateOrganizationAccess).not.toHaveBeenCalled();
  });

  it("activates access with the parsed values and redirects to bay view by default", async () => {
    mockActivateOrganizationAccess.mockResolvedValue(undefined);

    const result = await completeOrganizationLogin(EMPTY_STATE, formWith());

    expect(mockActivateOrganizationAccess).toHaveBeenCalledWith(db, {
      organizationId: "org-1",
      pin: "1234",
      confirmPin: "1234",
    });
    expect(result).toEqual({ redirectTo: "/dashboard/bay-view" });
  });

  it("uses the redirectTo field from the form when provided", async () => {
    mockActivateOrganizationAccess.mockResolvedValue(undefined);

    const result = await completeOrganizationLogin(
      EMPTY_STATE,
      formWith({ redirectTo: "/custom-page" }),
    );

    expect(result).toEqual({ redirectTo: "/custom-page" });
  });

  it("returns the AppError message when activation fails with an AppError", async () => {
    mockActivateOrganizationAccess.mockRejectedValue(
      new AppError("PIN already set"),
    );

    const result = await completeOrganizationLogin(EMPTY_STATE, formWith());

    expect(mockReportServerError).toHaveBeenCalled();
    expect(result).toEqual({ formError: "PIN already set" });
  });

  it("returns a generic message when activation fails with a non-AppError", async () => {
    mockActivateOrganizationAccess.mockRejectedValue(new Error("boom"));

    const result = await completeOrganizationLogin(EMPTY_STATE, formWith());

    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    expect(result).toEqual({
      formError: "Unable to verify organization access",
    });
  });
});
