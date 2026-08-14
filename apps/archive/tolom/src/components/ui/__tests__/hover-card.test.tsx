import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function renderHoverCard(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("HoverCard", () => {
  function TestHoverCard({ open = false }: { open?: boolean }) {
    const [isOpen, setIsOpen] = useState(open);
    return (
      <HoverCard open={isOpen} onOpenChange={setIsOpen}>
        <HoverCardTrigger>
          <button type="button">Hover me</button>
        </HoverCardTrigger>
        <HoverCardContent>
          <span>Card content</span>
        </HoverCardContent>
      </HoverCard>
    );
  }

  it("renders trigger element", () => {
    render(<TestHoverCard />);
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("does not show content by default", () => {
    const { $ } = renderHoverCard(<TestHoverCard />);
    expect($("[data-slot='hover-card-content']")).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    const { $ } = renderHoverCard(<TestHoverCard open />);
    expect($("[data-slot='hover-card-content']")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders trigger with data-slot", () => {
    const { $ } = renderHoverCard(<TestHoverCard />);
    expect($("[data-slot='hover-card-trigger']")).toBeInTheDocument();
  });

  it("renders with custom className on content", () => {
    const { $ } = renderHoverCard(
      <HoverCard open>
        <HoverCardTrigger>
          <button type="button">Hover</button>
        </HoverCardTrigger>
        <HoverCardContent className="custom-content">Content</HoverCardContent>
      </HoverCard>,
    );
    const content = $("[data-slot='hover-card-content']");
    expect(content?.className).toContain("custom-content");
  });

  it("renders content with different side", () => {
    const { $ } = renderHoverCard(
      <HoverCard open>
        <HoverCardTrigger>
          <button type="button">Hover</button>
        </HoverCardTrigger>
        <HoverCardContent side="right">Right content</HoverCardContent>
      </HoverCard>,
    );
    expect($("[data-slot='hover-card-content']")).toBeInTheDocument();
  });
});
