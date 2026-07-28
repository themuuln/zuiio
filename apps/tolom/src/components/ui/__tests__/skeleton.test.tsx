import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "@/components/ui/skeleton";

function renderSkeleton(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Skeleton", () => {
  it("renders a div with data-slot skeleton", () => {
    const { $ } = renderSkeleton(<Skeleton />);
    const el = $("[data-slot='skeleton']");
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("DIV");
  });

  it("applies animate-pulse and rounded-md classes", () => {
    const { $ } = renderSkeleton(<Skeleton />);
    const el = $("[data-slot='skeleton']");
    expect(el?.className).toContain("animate-pulse");
    expect(el?.className).toContain("rounded-md");
    expect(el?.className).toContain("bg-muted");
  });

  it("accepts custom className", () => {
    const { $ } = renderSkeleton(<Skeleton className="h-10 w-full" />);
    const el = $("[data-slot='skeleton']");
    expect(el?.className).toContain("h-10");
    expect(el?.className).toContain("w-full");
  });

  it("accepts style prop", () => {
    const { $ } = renderSkeleton(
      <Skeleton style={{ width: 200, height: 20 }} />,
    );
    const el = $("[data-slot='skeleton']");
    expect(el).toHaveStyle({ width: "200px", height: "20px" });
  });

  it("passes additional props to the div", () => {
    const { $ } = renderSkeleton(
      <Skeleton data-testid="skel" aria-label="Loading" />,
    );
    const el = $("[data-testid='skel']");
    expect(el).toHaveAttribute("aria-label", "Loading");
  });

  it("renders inline children if provided", () => {
    const { $ } = renderSkeleton(<Skeleton>Loading content</Skeleton>);
    const el = $("[data-slot='skeleton']");
    expect(el).toHaveTextContent("Loading content");
  });
});
