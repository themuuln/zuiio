import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionExpiredDialog } from "@/components/subscription-expired-dialog";
import { reportServerError } from "@/lib/sentry-report-server";
import type { SubscriptionStatus } from "@/lib/types";
import { render } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    // biome-ignore lint/performance/noImgElement: test double for next/image
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

const mockFetch = vi.fn();

function status(overrides: Partial<SubscriptionStatus>): SubscriptionStatus {
  return {
    status: "trial",
    expired: true,
    plan_type: "pro",
    expires_at: "2026-08-01T00:00:00Z",
    grace_period_end: null,
    trial: true,
    ...overrides,
  };
}

function renderDialog(subscriptionStatus: SubscriptionStatus = status({})) {
  return render(
    <SubscriptionExpiredDialog
      orgId="org-1"
      orgName="Acme Garage"
      subscriptionStatus={subscriptionStatus}
    />,
  );
}

describe("SubscriptionExpiredDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it("renders nothing when the subscription is not expired", () => {
    renderDialog(status({ expired: false }));
    // ThemeProvider injects a script tag, so assert on dialog content instead
    expect(screen.queryByText("welcomeTitle")).not.toBeInTheDocument();
    expect(screen.queryByText("expiredTitle")).not.toBeInTheDocument();
  });

  it("shows the 14-day trial CTA for new subscriptions and starts a trial", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    renderDialog(status({ status: "none" }));

    expect(screen.getByText("welcomeTitle")).toBeInTheDocument();
    expect(screen.getByText("trialLength")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "startTrialButton" }));
    });

    expect(await screen.findByText("trialStartedTitle")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/subscription",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "start-trial" }),
      }),
    );
  });

  it("shows bank transfer details for expired subscriptions and renews", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    renderDialog(status({ grace_period_end: "2026-08-15T00:00:00Z" }));

    expect(screen.getByText("expiredTitle")).toBeInTheDocument();
    expect(screen.getByText("graceEnds")).toBeInTheDocument();
    expect(screen.getByText("MN110005005431666225")).toBeInTheDocument();
    expect(screen.getByText("Acme Garage")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "renewButton" }));
    });

    expect(await screen.findByText("renewedTitle")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/subscription",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "renew" }),
      }),
    );
  });

  it("switches the displayed bank account when another bank is selected", () => {
    renderDialog();

    const tdbItem = screen.getByText("TDB");
    fireEvent.pointerDown(tdbItem, { pointerType: "mouse" });
    fireEvent.click(tdbItem);

    expect(screen.getByText("MN960004000423063343")).toBeInTheDocument();
    expect(screen.queryByText("MN110005005431666225")).not.toBeInTheDocument();
  });

  it("copies the bank account to the clipboard", () => {
    renderDialog();
    const copyButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector(".lucide-copy"));
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "MN110005005431666225",
    );
    expect(toast.success).toHaveBeenCalledWith("copied");
  });

  it("shows the renewal error and reports it when the API fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Bank transfer rejected" } }),
    });
    renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "renewButton" }));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Bank transfer rejected");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    expect(screen.getByText("Bank transfer rejected")).toBeInTheDocument();
  });

  it("shows the trial-start error when the trial API fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    renderDialog(status({ status: "none" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "startTrialButton" }));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("network down");
    });
    expect(screen.getByText("network down")).toBeInTheDocument();
  });
});
