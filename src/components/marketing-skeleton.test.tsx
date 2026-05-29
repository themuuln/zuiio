import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingPageSkeleton } from "./marketing-skeleton";

describe("MarketingPageSkeleton", () => {
  it("renders the skeleton structure", () => {
    render(<MarketingPageSkeleton />);

    // Should have a main container
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("renders nav skeleton", () => {
    const { container } = render(<MarketingPageSkeleton />);

    // Should have header with skeleton elements
    const header = container.querySelector("header");
    expect(header).toBeTruthy();
  });

  it("renders hero section skeleton", () => {
    const { container } = render(<MarketingPageSkeleton />);

    // Should have a section with max-w-2xl (hero section)
    const heroSection = container.querySelector("section");
    expect(heroSection).toBeTruthy();
  });

  it("renders cards section skeleton", () => {
    const { container } = render(<MarketingPageSkeleton />);

    // Should have multiple sections
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it("renders footer skeleton", () => {
    const { container } = render(<MarketingPageSkeleton />);

    // Should have a footer
    const footer = container.querySelector("footer");
    expect(footer).toBeTruthy();
  });

  it("has proper accessibility structure", () => {
    const { container } = render(<MarketingPageSkeleton />);

    // Should have landmark elements
    expect(container.querySelector("header")).toBeTruthy();
    expect(container.querySelector("main")).toBeTruthy();
    expect(container.querySelector("footer")).toBeTruthy();
  });
});
