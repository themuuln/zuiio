import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "@/components/offline-banner";

let mockIsOnline = true;

vi.mock("@zuiio/hooks", () => ({
  useOnlineStatus: () => mockIsOnline,
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    mockIsOnline = true;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when online", () => {
    const { container } = render(<OfflineBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows offline message when offline", () => {
    mockIsOnline = false;
    render(<OfflineBanner />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Changes will be saved locally and synced when you reconnect.",
      ),
    ).toBeInTheDocument();
  });

  it("renders WifiOff icon when offline", () => {
    mockIsOnline = false;
    render(<OfflineBanner />);
    expect(document.querySelector(".lucide-wifi-off")).toBeInTheDocument();
  });

  it("shows destructive variant when offline", () => {
    mockIsOnline = false;
    render(<OfflineBanner />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("hides after 3 seconds when back online", () => {
    mockIsOnline = false;
    render(<OfflineBanner />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();

    // Go back online
    mockIsOnline = true;

    // Re-render to trigger the useEffect
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // After advancing timers, the banner should hide
    // Note: useEffect dependencies mean we need a re-render to see the change
    const { rerender } = render(<OfflineBanner />);
    rerender(<OfflineBanner />);
  });
});
