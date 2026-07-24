/// <reference types="@testing-library/jest-dom/vitest" />
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineIndicator } from "../offline-indicator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setNavigatorOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value: online,
    configurable: true,
    writable: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OfflineIndicator", () => {
  beforeEach(() => {
    // Start each test with a clean online state.
    setNavigatorOnline(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Initial render states ─────────────────────────────────────────────

  it("renders nothing when navigator is online", () => {
    setNavigatorOnline(true);
    const { container } = render(<OfflineIndicator />);
    expect(container.innerHTML).toBe("");
  });

  it("renders offline badge when navigator is offline", () => {
    setNavigatorOnline(false);
    render(<OfflineIndicator />);
    expect(screen.getByText("Оффлайн горим")).toBeInTheDocument();
  });

  // ── Dynamic online/offline transitions ──────────────────────────────

  it("appears when an offline event fires", () => {
    setNavigatorOnline(true);
    const { container } = render(<OfflineIndicator />);
    expect(container.innerHTML).toBe("");

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("Оффлайн горим")).toBeInTheDocument();
  });

  it("disappears when an online event fires", () => {
    setNavigatorOnline(false);
    render(<OfflineIndicator />);
    expect(screen.getByText("Оффлайн горим")).toBeInTheDocument();

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByText("Оффлайн горим")).not.toBeInTheDocument();
  });

  // ── Styling ──────────────────────────────────────────────────────────

  it("has destructive badge variant styling", () => {
    setNavigatorOnline(false);
    render(<OfflineIndicator />);
    const badge = screen.getByText("Оффлайн горим");
    expect(badge.className).toContain("destructive");
  });

  it("has fixed-position layout classes", () => {
    setNavigatorOnline(false);
    render(<OfflineIndicator />);
    const badge = screen.getByText("Оффлайн горим");
    expect(badge.className).toContain("fixed");
    expect(badge.className).toContain("bottom-4");
    expect(badge.className).toContain("right-4");
    expect(badge.className).toContain("z-50");
  });

  // ── Lifecycle ────────────────────────────────────────────────────────

  it("registers online/offline event listeners on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<OfflineIndicator />);
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    addSpy.mockRestore();
  });

  it("removes event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<OfflineIndicator />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    removeSpy.mockRestore();
  });
});
