import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function renderCollapsible(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Collapsible", () => {
  it("renders root with data-slot", () => {
    const { $ } = renderCollapsible(<Collapsible />);
    expect($("[data-slot='collapsible']")).toBeInTheDocument();
  });

  it("renders trigger", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    const trigger = screen.getByText("Toggle");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
  });

  it("renders content", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(
      screen.getByText("Content").closest("[data-slot='collapsible-content']"),
    ).toBeInTheDocument();
  });

  it("applies custom className on root", () => {
    const { $ } = renderCollapsible(<Collapsible className="custom" />);
    expect($("[data-slot='collapsible']")?.className).toContain("custom");
  });

  it("accepts additional props", () => {
    render(<Collapsible data-testid="collapsible" />);
    expect(screen.getByTestId("collapsible")).toBeInTheDocument();
  });
});
