import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerSkeleton } from "../_drawer-loading";

describe("DrawerSkeleton", () => {
  it("renders skeleton blocks while loading", () => {
    const { container } = render(
      <DrawerSkeleton loading error={null} onRetry={vi.fn()}>
        <span>content</span>
      </DrawerSkeleton>,
    );
    // One animate-pulse wrapper holding the eight shimmer rows
    const pulse = container.querySelector(".animate-pulse");
    expect(pulse).toBeTruthy();
    expect(pulse?.querySelectorAll("div")).toHaveLength(8);
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders the error message and retry button on error", () => {
    const onRetry = vi.fn();
    render(
      <DrawerSkeleton loading={false} error="Failed to load" onRetry={onRetry}>
        <span>content</span>
      </DrawerSkeleton>,
    );
    expect(screen.getByText("Failed to load")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders children when neither loading nor error", () => {
    render(
      <DrawerSkeleton loading={false} error={null} onRetry={vi.fn()}>
        <span>content</span>
      </DrawerSkeleton>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });
});
