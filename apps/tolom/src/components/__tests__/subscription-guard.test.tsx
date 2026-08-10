import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionGuard } from "@/components/subscription-guard";
import type { SubscriptionStatus } from "@/lib/types";
import { createTestQueryClient } from "@/test/test-utils";

const dialogState = vi.hoisted(() => ({
  props: null as null | {
    orgId: string;
    orgName: string;
    subscriptionStatus: SubscriptionStatus | null;
  },
}));
vi.mock("@/components/subscription-expired-dialog", () => ({
  SubscriptionExpiredDialog: (props: {
    orgId: string;
    orgName: string;
    subscriptionStatus: SubscriptionStatus | null;
  }) => {
    dialogState.props = props;
    return <div data-testid="expired-dialog" />;
  },
}));

const mockFetch = vi.fn();

function expiredStatus(): SubscriptionStatus {
  return {
    status: "trial",
    expired: true,
    plan_type: "pro",
    expires_at: "2026-08-01T00:00:00Z",
    grace_period_end: null,
    trial: true,
  };
}

function renderGuard() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <SubscriptionGuard orgId="org-1" orgName="Acme">
        <div>dashboard content</div>
      </SubscriptionGuard>
    </QueryClientProvider>,
  );
}

describe("SubscriptionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    dialogState.props = null;
  });

  it("renders the expired dialog when the subscription is expired", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expiredStatus() }),
    });
    renderGuard();

    await waitFor(() => {
      expect(screen.getByTestId("expired-dialog")).toBeInTheDocument();
    });
    expect(dialogState.props?.subscriptionStatus?.expired).toBe(true);
    expect(dialogState.props?.orgId).toBe("org-1");
    expect(dialogState.props?.orgName).toBe("Acme");
    // Children always render
    expect(screen.getByText("dashboard content")).toBeInTheDocument();
  });

  it("hides the dialog when the subscription is active", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { ...expiredStatus(), expired: false },
      }),
    });
    renderGuard();

    await waitFor(() => {
      expect(screen.queryByTestId("expired-dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("dashboard content")).toBeInTheDocument();
  });

  it("hides the dialog when the status fetch fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    renderGuard();

    await waitFor(() => {
      expect(screen.queryByTestId("expired-dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("dashboard content")).toBeInTheDocument();
  });
});
