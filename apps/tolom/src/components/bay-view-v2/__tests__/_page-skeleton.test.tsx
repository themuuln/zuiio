import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { BayViewPageSkeleton } from "../_page-skeleton";

describe("BayViewPageSkeleton", () => {
  it("renders toolbar, KPI and bay grid skeleton sections", () => {
    const { container } = render(<BayViewPageSkeleton />);
    // Toolbar + KPI + branch skeletons, plus 6 bay card shells
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(
      52,
    );
    expect(container.querySelectorAll(".min-h-\\[160px\\]")).toHaveLength(6);
  });
});
