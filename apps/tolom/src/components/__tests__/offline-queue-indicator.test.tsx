import { fireEvent, render, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineQueueIndicator } from "@/components/offline-queue-indicator";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

const queueState = vi.hoisted(() => ({
  mutations: [] as Array<{
    id: string;
    status: "pending" | "in-flight" | "failed";
    method: string;
    endpoint: string;
    error: string | null;
    createdAt: string;
  }>,
  pendingCount: 0,
  isReplaying: false,
}));
vi.mock("@/lib/offline/mutation-queue-provider", () => ({
  useMutationQueue: () => ({
    mutations: queueState.mutations,
    pendingCount: queueState.pendingCount,
    isReplaying: queueState.isReplaying,
  }),
}));

const pendingMutation = {
  id: "m-1",
  status: "pending" as const,
  method: "PATCH",
  endpoint: "/api/organizations/org-1/work-orders/wo-42",
  error: null,
  createdAt: "2026-08-09T10:00:00Z",
};

describe("OfflineQueueIndicator", () => {
  beforeEach(() => {
    queueState.mutations = [];
    queueState.pendingCount = 0;
    queueState.isReplaying = false;
  });

  it("renders nothing when the queue is empty and not replaying", () => {
    const { container } = render(<OfflineQueueIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the pending badge and lists mutation details in the drawer", () => {
    queueState.mutations = [pendingMutation];
    queueState.pendingCount = 1;
    render(<OfflineQueueIndicator />);

    expect(screen.getByText("pendingCount")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("PATCH")).toBeInTheDocument();
    expect(screen.getByText("wo-42")).toBeInTheDocument();
    expect(screen.getByText("offlineQueue")).toBeInTheDocument();
  });

  it("shows the error message for failed mutations", () => {
    queueState.mutations = [
      { ...pendingMutation, status: "failed", error: "Network error" },
    ];
    queueState.pendingCount = 1;
    render(<OfflineQueueIndicator />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows the syncing state while replaying", () => {
    queueState.isReplaying = true;
    render(<OfflineQueueIndicator />);

    expect(screen.getByText("syncing")).toBeInTheDocument();
    expect(
      document.querySelector(".lucide-refresh-cw, .lucide-rotate-cw"),
    ).toBeTruthy();
  });

  it("shows the all-synced message when replaying with no pending mutations", () => {
    queueState.isReplaying = true;
    render(<OfflineQueueIndicator />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("allChangesSynced")).toBeInTheDocument();
  });
});
