import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSessionMock = vi.fn();
const getUserMock = vi.fn();
const finalizeSignupMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: {
    exchangeCodeForSession: exchangeCodeForSessionMock,
    getUser: getUserMock,
  },
}));
const reportServerErrorMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/services/signup-service", () => ({
  finalizeSignup: finalizeSignupMock,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const { GET } = await import("./route");

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({ data: { user: null } });
    finalizeSignupMock.mockResolvedValue(undefined);
  });

  it("redirects to the login error when no authorization code is provided", async () => {
    const response = await GET(
      new NextRequest("https://tolom.example/mn/auth/callback"),
    );

    expect(response.headers.get("location")).toBe(
      "https://tolom.example/auth/login?error=auth_callback_error",
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("redirects to the login error when code exchange fails", async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      error: new Error("invalid code"),
    });

    const response = await GET(
      new NextRequest(
        "https://tolom.example/mn/auth/callback?code=invalid-code",
      ),
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("invalid-code");
    expect(response.headers.get("location")).toBe(
      "https://tolom.example/auth/login?error=auth_callback_error",
    );
    expect(finalizeSignupMock).not.toHaveBeenCalled();
  });

  it("finalizes signup and redirects to the requested host and path", async () => {
    const response = await GET(
      new NextRequest(
        "https://tolom.example/mn/auth/callback?code=valid-code&next=%2Fdashboard",
        { headers: { "x-forwarded-host": "app.tolom.example" } },
      ),
    );

    expect(finalizeSignupMock).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "https://app.tolom.example/dashboard",
    );
  });

  it("reports finalize errors but still completes the callback redirect", async () => {
    const error = new Error("finalize failed");
    finalizeSignupMock.mockRejectedValueOnce(error);

    const response = await GET(
      new NextRequest("https://tolom.example/mn/auth/callback?code=valid-code"),
    );

    expect(reportServerErrorMock).toHaveBeenCalledWith(
      "Finalize signup after callback failed:",
      error,
    );
    expect(response.headers.get("location")).toBe(
      "https://tolom.example/auth/select-organization",
    );
  });
});
