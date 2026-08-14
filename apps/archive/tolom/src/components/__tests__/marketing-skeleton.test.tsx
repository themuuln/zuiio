import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingPageSkeleton } from "@/components/marketing-skeleton";

describe("MarketingPageSkeleton", () => {
  it("renders nav, hero, content, cards and footer skeleton sections", () => {
    const { container } = render(<MarketingPageSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(20);
    expect(container.querySelector("header")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(container.querySelector("footer")).toBeInTheDocument();
    // 4 cards in the cards section
    expect(
      container.querySelectorAll("section .rounded-xl.border.bg-card"),
    ).toHaveLength(4);
  });
});
