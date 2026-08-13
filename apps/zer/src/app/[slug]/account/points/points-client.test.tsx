import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicLoyalty } from "@/lib/storefront-loyalty";

const mockUseStoreSession = vi.hoisted(() => vi.fn());
const mockFetchLoyalty = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("../use-store-session", () => ({
  useStoreSession: mockUseStoreSession,
}));
vi.mock("@/lib/storefront-loyalty", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/storefront-loyalty")>();
  return { ...actual, fetchPublicLoyalty: mockFetchLoyalty };
});
vi.mock("@/lib/supabase/client", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@zuiio/capture", () => ({ capture: mockCapture }));

import { PointsClient } from "./points-client";

function signedOut() {
  return { state: { status: "signedOut" } };
}

function accountState() {
  return {
    state: {
      status: "account",
      account: {
        id: "buyer-1",
        email: "buyer@example.com",
        display_name: "Худалдан авагч",
        phone: "99110011",
      },
    },
  };
}

function loyaltyFixture(): PublicLoyalty {
  return {
    enabled: true,
    balance: 12000,
    points_per_mnt: 1,
    min_purchase: 0,
    history: [
      {
        id: "h1",
        points: 5000,
        type: "earned",
        notes: null,
        reference_id: null,
        created_at: "2026-08-13T00:00:00Z",
      },
      {
        id: "h2",
        points: -3000,
        type: "redeemed",
        notes: null,
        reference_id: null,
        created_at: "2026-08-01T00:00:00Z",
      },
    ],
    rewards: [
      {
        id: "r1",
        name: "5,000₮ хямдрал",
        description: null,
        points_cost: 5000,
        discount_type: "flat",
        discount_value: 5000,
      },
    ],
  };
}

beforeEach(() => {
  mockUseStoreSession.mockReset();
  mockFetchLoyalty.mockReset();
  mockCapture.mockClear();
  mockCreateClient.mockReturnValue({});
});

describe("PointsClient", () => {
  it("shows the sign-in requirement and skips the fetch for guests", () => {
    mockUseStoreSession.mockReturnValue(signedOut());

    render(<PointsClient slug="my-shop" />);

    expect(
      screen.getAllByText("Оноо харахын тулд нэвтэрнэ үү.").length,
    ).toBeGreaterThan(0);
    expect(mockFetchLoyalty).not.toHaveBeenCalled();
  });

  it("renders balance, tier, history and rewards for an account buyer", async () => {
    mockUseStoreSession.mockReturnValue(accountState());
    mockFetchLoyalty.mockResolvedValue(loyaltyFixture());

    render(<PointsClient slug="my-shop" />);

    await waitFor(() => {
      expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
    });
    // Balance card: 12,000 points ≈ ₮12,000.
    expect(screen.getAllByText("12,000").length).toBeGreaterThan(0);
    // Tier.
    expect(screen.getByText("Алтан")).toBeInTheDocument();
    // History labels + signed values.
    expect(screen.getByText("Оноо авсан")).toBeInTheDocument();
    expect(screen.getByText("Оноо зарцуулсан")).toBeInTheDocument();
    expect(screen.getByText("+5,000")).toBeInTheDocument();
    expect(screen.getByText("-3,000")).toBeInTheDocument();
    // Rewards.
    expect(screen.getByText("Шагналууд")).toBeInTheDocument();
    expect(screen.getByText("5,000₮ хямдрал")).toBeInTheDocument();
    expect(screen.getByText("5,000 оноо")).toBeInTheDocument();
  });

  it("shows the not-offered state when loyalty is disabled", async () => {
    mockUseStoreSession.mockReturnValue(accountState());
    mockFetchLoyalty.mockResolvedValue({
      ...loyaltyFixture(),
      enabled: false,
    });

    render(<PointsClient slug="my-shop" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Энэ дэлгүүр одоогоор лоялти хөтөлбөр санал болгохгүй байна.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows the not-offered state when the RPC returns null", async () => {
    mockUseStoreSession.mockReturnValue(accountState());
    mockFetchLoyalty.mockResolvedValue(null);

    render(<PointsClient slug="my-shop" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Энэ дэлгүүр одоогоор лоялти хөтөлбөр санал болгохгүй байна.",
        ),
      ).toBeInTheDocument();
    });
  });
});
