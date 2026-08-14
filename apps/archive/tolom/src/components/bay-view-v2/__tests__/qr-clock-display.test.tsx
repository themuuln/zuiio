import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { QrClockDisplay } from "../qr-clock-display";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
      params ? `${key}[${Object.values(params).join("|")}]` : key,
  };
});

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,FAKEQR"),
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

let postgresCallback: ((payload: unknown) => void) | null = null;
const removeChannel = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: vi.fn(() => ({
      on: (_event: string, _opts: unknown, cb: (payload: unknown) => void) => {
        postgresCallback = cb;
        return { subscribe: vi.fn() };
      },
      subscribe: vi.fn(),
    })),
    removeChannel,
  }),
}));

const fetchMock = vi.fn();

const tokenResponse = {
  data: {
    rawToken: "tok-123",
    sessionId: "sess-1",
    expiresAt: "2026-08-09T10:45:00Z",
  },
};

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  orgId: "org-1",
  mechanicId: "m-1",
  mechanicName: "Бат",
};

/** Flush pending microtasks (fetch → QR → setState chains) inside act. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe("QrClockDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    postgresCallback = null;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => tokenResponse,
    });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("generates a QR code and shows the countdown", async () => {
    render(<QrClockDisplay {...baseProps} />);
    await settle();
    expect(screen.getByAltText("Clock-in QR code")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/clock/qr",
      expect.objectContaining({ method: "POST" }),
    );
    expect(screen.getByText("qrRefreshesIn[45]")).toBeTruthy();
    expect(screen.getByText("qrScanInstructions")).toBeTruthy();
  });

  it("counts down and refreshes the QR after the interval", async () => {
    render(<QrClockDisplay {...baseProps} />);
    await settle();
    expect(screen.getByAltText("Clock-in QR code")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });
    await settle();
    // Auto-refresh fired a second token request and regenerated the QR
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByAltText("Clock-in QR code")).toBeTruthy();
  });

  it("shows the confirmed state when the token is claimed", async () => {
    const onOpenChange = vi.fn();
    render(<QrClockDisplay {...baseProps} onOpenChange={onOpenChange} />);
    await settle();
    expect(screen.getByAltText("Clock-in QR code")).toBeTruthy();
    await act(async () => {
      postgresCallback?.({
        eventType: "UPDATE",
        new: { claimed_at: "2026-08-09T10:05:00Z" },
        old: { claimed_at: null },
      });
    });
    expect(screen.getByText("qrClockedIn[Бат]")).toBeTruthy();
    expect(screen.getByText(/qrAt\[/)).toBeTruthy();
    // Auto-close after 3s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the error state and retries automatically", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    render(<QrClockDisplay {...baseProps} />);
    await settle();
    expect(screen.getByText("network down")).toBeTruthy();
    expect(screen.getByRole("button", { name: "qrTryAgain" })).toBeTruthy();
    // Auto-retry after 3s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
