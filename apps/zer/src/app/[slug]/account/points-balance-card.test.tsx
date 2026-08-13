import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchLoyalty = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/storefront-loyalty", () => ({
  fetchPublicLoyalty: mockFetchLoyalty,
}));
vi.mock("@zuiio/capture", () => ({ capture: mockCapture }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: mockCreateClient,
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { PointsBalanceCard } from "./points-balance-card";

function loyalty(overrides: { enabled?: boolean; balance?: number } = {}) {
  return {
    enabled: overrides.enabled ?? true,
    balance: overrides.balance ?? 5000,
    points_per_mnt: 1,
    min_purchase: 0,
    history: [],
    rewards: [],
  };
}

beforeEach(() => {
  mockFetchLoyalty.mockReset();
  mockCapture.mockClear();
  mockCreateClient.mockReturnValue({});
});

describe("PointsBalanceCard", () => {
  it("renders the balance link when the buyer has points", async () => {
    mockFetchLoyalty.mockResolvedValue(loyalty({ balance: 5000 }));

    render(<PointsBalanceCard slug="my-shop" />);

    await waitFor(() => {
      expect(screen.getByText("Миний оноо")).toBeInTheDocument();
    });
    expect(mockFetchLoyalty).toHaveBeenCalledWith({}, "my-shop");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/my-shop/account/points");
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });

  it("renders nothing when the program is disabled or balance is zero", async () => {
    mockFetchLoyalty.mockResolvedValue(loyalty({ enabled: false }));
    const { container: disabled } = render(
      <PointsBalanceCard slug="my-shop" />,
    );
    await waitFor(() => expect(mockFetchLoyalty).toHaveBeenCalled());
    expect(disabled.firstChild).toBeNull();

    mockFetchLoyalty.mockResolvedValue(loyalty({ balance: 0 }));
    const { container: zero } = render(<PointsBalanceCard slug="my-shop" />);
    await waitFor(() => expect(mockFetchLoyalty).toHaveBeenCalledTimes(2));
    expect(zero.firstChild).toBeNull();
  });

  it("renders nothing and captures when the lookup fails", async () => {
    const err = new Error("rpc failed");
    mockFetchLoyalty.mockRejectedValue(err);

    const { container } = render(<PointsBalanceCard slug="my-shop" />);

    await waitFor(() => expect(mockCapture).toHaveBeenCalledTimes(1));
    expect(mockCapture).toHaveBeenCalledWith(err, {
      context: "points card: get_public_loyalty",
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the RPC returns null (unknown org)", async () => {
    mockFetchLoyalty.mockResolvedValue(null);

    const { container } = render(<PointsBalanceCard slug="my-shop" />);

    await waitFor(() => expect(mockFetchLoyalty).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });
});
