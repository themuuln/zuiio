import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerSkeletonLayout } from "../_drawer-skeleton-layout";

describe("DrawerSkeletonLayout", () => {
  it("renders the compact layout with skeleton blocks", () => {
    const { container } = render(<DrawerSkeletonLayout />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(
      15,
    );
    // Compact layout does not include the timeline right column
    expect(container.querySelectorAll(".xl\\:border-l").length).toBe(0);
  });

  it("renders the full-screen layout with the timeline column", () => {
    const { container } = render(<DrawerSkeletonLayout isFullScreen />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(
      23,
    );
  });
});
