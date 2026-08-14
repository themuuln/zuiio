import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/services/signup-service", () => ({
  finalizeSignup: vi.fn(),
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { reportServerError } from "@/lib/sentry-report-server";
import { finalizeSignup } from "@/lib/services/signup-service";
import { createClient } from "@/lib/supabase/server";
import { createOrganization } from "../actions";

const mockReportServerError = vi.mocked(reportServerError);
const mockFinalizeSignup = vi.mocked(finalizeSignup);
const mockCreateClient = vi.mocked(createClient);

const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    organizationName: "UB Auto Service",
    businessType: "general_repair",
    enablePartSuggestions: "on",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

async function runWithRedirect(formData: FormData = makeFormData()) {
  redirectMock.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
  await expect(createOrganization({}, formData)).rejects.toThrow(
    REDIRECT_ERROR,
  );
  expect(redirectMock).toHaveBeenCalledWith("/auth/select-organization");
}

beforeEach(() => {
  vi.resetAllMocks();
  mockFinalizeSignup.mockResolvedValue({ organizationId: "org-1" } as never);
  mockCreateClient.mockResolvedValue(createMockSupabaseClient() as never);
});

describe("createOrganization", () => {
  it("returns field errors for an empty organization name", async () => {
    const result = await createOrganization(
      {},
      makeFormData({ organizationName: "" }),
    );

    expect(result.fieldErrors?.organizationName).toMatch(
      /at least 2 characters/i,
    );
    expect(mockFinalizeSignup).not.toHaveBeenCalled();
  });

  it("rejects an invalid business type", async () => {
    const result = await createOrganization(
      {},
      makeFormData({ businessType: "spaceship" }),
    );

    expect(result.fieldErrors?.businessType).toBeDefined();
  });

  it("finalizes signup and redirects to PIN setup when signed in", async () => {
    await runWithRedirect();

    expect(mockFinalizeSignup).toHaveBeenCalledWith(expect.anything(), {
      orgName: "UB Auto Service",
      businessType: "general_repair",
      enablePartSuggestions: true,
    });
  });

  it("turns the enablePartSuggestions checkbox value into a boolean", async () => {
    await runWithRedirect(makeFormData({ enablePartSuggestions: "off" }));

    expect(mockFinalizeSignup).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enablePartSuggestions: false }),
    );
  });

  it("returns a form error when the user is not signed in", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const result = await createOrganization({}, makeFormData());

    expect(result.formError).toBe(
      "You must be signed in to create an organization.",
    );
    expect(mockFinalizeSignup).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("reports finalize failures and returns a generic form error", async () => {
    const error = new Error("org creation failed");
    mockFinalizeSignup.mockRejectedValue(error);

    const result = await createOrganization({}, makeFormData());

    expect(result.formError).toBe(
      "Failed to create organization. Please try again.",
    );
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Failed to create organization:",
      error,
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
