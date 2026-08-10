import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import ClockPage from "../page";

const mocks = vi.hoisted(() => ({
  useCurrentUserRole: vi.fn(),
  useQrScanner: vi.fn(),
  redirectToLogin: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return { ...actual, useTranslations: () => (key: string) => key };
});

vi.mock("@/hooks/use-current-user-role", () => ({
  useCurrentUserRole: mocks.useCurrentUserRole,
}));

vi.mock("@/lib/hooks/use-qr-scanner", () => ({
  useQrScanner: mocks.useQrScanner,
}));

vi.mock("@/lib/auth-redirect", () => ({
  redirectToLogin: mocks.redirectToLogin,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

function scannerResult(overrides: Record<string, unknown> = {}) {
  return {
    startScanning: vi.fn().mockResolvedValue(undefined),
    stopScanning: vi.fn(),
    isScanning: false,
    error: null,
    ...overrides,
  };
}

function okJson(data: unknown) {
  return { ok: true, json: async () => ({ data }) };
}

describe("ClockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCurrentUserRole.mockReturnValue({
      profile: { organizationId: "org-1" },
      loading: false,
    });
    mocks.useQrScanner.mockReturnValue(scannerResult());
  });

  it("shows a skeleton while the role is loading", () => {
    mocks.useCurrentUserRole.mockReturnValue({ profile: null, loading: true });

    render(<ClockPage />);

    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("redirects to login when unauthenticated", () => {
    mocks.useCurrentUserRole.mockReturnValue({ profile: null, loading: false });

    render(<ClockPage />);

    expect(mocks.redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("shows the no-organization state", () => {
    mocks.useCurrentUserRole.mockReturnValue({
      profile: { organizationId: null },
      loading: false,
    });

    render(<ClockPage />);

    expect(screen.getByText("clock.noOrganization")).toBeTruthy();
  });

  it("verifies a manual token, confirms clock-in, and reports success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson({ direction: "in", mechanicName: "Бат" }))
      .mockResolvedValueOnce(okJson({}));
    vi.stubGlobal("fetch", fetchMock);

    render(<ClockPage />);
    expect(screen.getByText("clock.pageTitle")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("clock.enterToken"), {
      target: { value: "tok-1" },
    });
    fireEvent.click(screen.getByText("clock.submit"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("clock.confirmClockIn")).toBeTruthy();
    // Mechanic-name line only renders when the API returned a mechanic
    expect(screen.getByText("clock.confirmAs")).toBeTruthy();

    fireEvent.click(screen.getByText("clock.confirm"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("clock.success")).toBeTruthy();
    expect(screen.getByText("clock.clockedInAt")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/clock/verify",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/api/organizations/org-1/me/time/clock-in",
    );
  });

  it("does not submit an empty manual token", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ClockPage />);

    fireEvent.click(screen.getByText("clock.submit"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the error state and reports it when verification fails", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Bad token" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ClockPage />);

    fireEvent.change(screen.getByPlaceholderText("clock.enterToken"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByText("clock.submit"));

    await waitFor(() => expect(screen.getByText("Bad token")).toBeTruthy());
    expect(mocks.reportServerError).toHaveBeenCalled();
  });

  it("shows the error state when the clock-in confirm fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson({ direction: "out", mechanicName: null }))
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "nope" } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ClockPage />);

    fireEvent.change(screen.getByPlaceholderText("clock.enterToken"), {
      target: { value: "tok" },
    });
    fireEvent.click(screen.getByText("clock.submit"));

    await waitFor(() =>
      expect(screen.getByText("clock.confirmClockOut")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("clock.confirm"));

    await waitFor(() => expect(screen.getByText("clock.error")).toBeTruthy());
  });

  it("retry resets the state and restarts the scanner", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "x" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const scanner = scannerResult();
    mocks.useQrScanner.mockReturnValue(scanner);

    render(<ClockPage />);

    fireEvent.change(screen.getByPlaceholderText("clock.enterToken"), {
      target: { value: "tok" },
    });
    fireEvent.click(screen.getByText("clock.submit"));
    await waitFor(() => expect(screen.getByText("clock.retry")).toBeTruthy());

    fireEvent.click(screen.getByText("clock.retry"));

    expect(screen.getByPlaceholderText("clock.enterToken")).toBeTruthy();
    expect(scanner.startScanning).toHaveBeenCalled();
  });

  it("shows the error state when the scanner reports a camera error", () => {
    mocks.useQrScanner.mockReturnValue(
      scannerResult({ error: "Camera denied" }),
    );

    render(<ClockPage />);

    expect(screen.getByText("Camera denied")).toBeTruthy();
  });
});
