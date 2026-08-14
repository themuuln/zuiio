import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "@/components/ui/scroll-area";

function renderScrollArea(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("ScrollArea", () => {
  it("renders with data-slot scroll-area", () => {
    const { $ } = renderScrollArea(<ScrollArea />);
    expect($("[data-slot='scroll-area']")).toBeInTheDocument();
  });

  it("renders viewport with data-slot scroll-area-viewport", () => {
    const { $ } = renderScrollArea(<ScrollArea />);
    expect($("[data-slot='scroll-area-viewport']")).toBeInTheDocument();
  });

  it("renders children inside the viewport", () => {
    render(
      <ScrollArea>
        <div data-testid="scroll-content">Scrollable content</div>
      </ScrollArea>,
    );
    expect(screen.getByTestId("scroll-content")).toBeInTheDocument();
    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderScrollArea(
      <ScrollArea className="custom-scroll-area" />,
    );
    expect($("[data-slot='scroll-area']")?.className).toContain(
      "custom-scroll-area",
    );
  });
});
