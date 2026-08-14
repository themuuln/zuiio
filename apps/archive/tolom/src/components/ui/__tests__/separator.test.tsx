import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "@/components/ui/separator";

function renderSeparator(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Separator", () => {
  it("renders with data-slot separator", () => {
    const { $ } = renderSeparator(<Separator />);
    expect($("[data-slot='separator']")).toBeInTheDocument();
  });

  it("renders as horizontal by default", () => {
    const { $ } = renderSeparator(<Separator />);
    const sep = $("[data-slot='separator']");
    expect(sep).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders as vertical", () => {
    const { $ } = renderSeparator(<Separator orientation="vertical" />);
    const sep = $("[data-slot='separator']");
    expect(sep).toHaveAttribute("data-orientation", "vertical");
  });

  it("accepts custom className", () => {
    const { $ } = renderSeparator(<Separator className="custom-sep" />);
    expect($("[data-slot='separator']")?.className).toContain("custom-sep");
  });

  it("passes additional props", () => {
    const { $ } = renderSeparator(
      <Separator data-testid="test-sep" aria-hidden />,
    );
    expect($("[data-testid='test-sep']")).toHaveAttribute("aria-hidden");
  });

  it("has shrink-0 utility class", () => {
    const { $ } = renderSeparator(<Separator />);
    expect($("[data-slot='separator']")?.className).toContain("shrink-0");
  });

  it("has bg-border class", () => {
    const { $ } = renderSeparator(<Separator />);
    expect($("[data-slot='separator']")?.className).toContain("bg-border");
  });
});
