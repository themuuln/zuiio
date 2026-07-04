// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeWrapper } from "./NodeWrapper";

describe("NodeWrapper", () => {
  it("renders header with icon and label", () => {
    render(
      <NodeWrapper selected={false} color="#3b82f6" icon="💬" label="Send Message">
        <p>Body content</p>
      </NodeWrapper>
    );

    expect(screen.getByText("💬")).toBeDefined();
    expect(screen.getByText("Send Message")).toBeDefined();
    expect(screen.getByText("Body content")).toBeDefined();
  });

  it("applies selected styles when selected is true", () => {
    const { container } = render(
      <NodeWrapper selected={true} color="#22c55e" icon="▶" label="Start">
        <p>Body</p>
      </NodeWrapper>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("border-accent");
  });

  it("applies default border when not selected", () => {
    const { container } = render(
      <NodeWrapper selected={false} color="#22c55e" icon="▶" label="Start">
        <p>Body</p>
      </NodeWrapper>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("border-border");
  });

  it("renders header with correct background color", () => {
    const { container } = render(
      <NodeWrapper selected={false} color="#ef4444" icon="⚡" label="Action">
        <p>Body</p>
      </NodeWrapper>
    );

    const header = container.querySelector('[style*="background:"]') as HTMLElement;
    expect(header).not.toBeNull();
    // jsdom normalizes hex to rgb
    expect(header.style.background).toBe("rgb(239, 68, 68)");
  });

  it("renders headerRight content when provided", () => {
    render(
      <NodeWrapper
        selected={false}
        color="#ec4899"
        icon="🎴"
        label="Card Carousel"
        headerRight={<span>3</span>}
      >
        <p>Body</p>
      </NodeWrapper>
    );

    expect(screen.getByText("3")).toBeDefined();
  });

  it("renders footer when provided", () => {
    render(
      <NodeWrapper
        selected={false}
        color="#a855f7"
        icon="🔀"
        label="Condition"
        footer={<div data-testid="footer">Yes / No</div>}
      >
        <p>Body</p>
      </NodeWrapper>
    );

    expect(screen.getByTestId("footer")).toBeDefined();
    expect(screen.getByText("Yes / No")).toBeDefined();
  });

  it("renders in sticky-note mode with custom colors", () => {
    const noteColors = {
      bg: "#3a3510",
      border: "#5c5220",
      text: "#e8d44d",
    };
    // jsdom normalizes hex to rgb
    const rgbBg = "rgb(58, 53, 16)";
    const rgbBorder = "rgb(92, 82, 32)";

    const { container } = render(
      <NodeWrapper
        selected={false}
        color="#eab308"
        icon="📌"
        label="Note"
        isNote
        noteColors={noteColors}
      >
        <p>Note text</p>
      </NodeWrapper>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.background).toBe(rgbBg);
    expect(outer.style.borderColor).toBe(rgbBorder);
    // In note mode, icon and label are in the same span
    // In note mode, icon and label are in the same span containing "📌 Note"
    expect(screen.getByText(/📌 Note/)).toBeDefined();
    expect(screen.getByText("Note text")).toBeDefined();
  });

  it("applies className to outer container", () => {
    const { container } = render(
      <NodeWrapper
        selected={false}
        color="#3b82f6"
        icon="💬"
        label="Test"
        className="animate-node-in"
      >
        <p>Body</p>
      </NodeWrapper>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("animate-node-in");
  });

  it("renders empty children gracefully", () => {
    const { container } = render(
      <NodeWrapper selected={false} color="#3b82f6" icon="💬" label="Empty" />
    );

    expect(container.firstElementChild).not.toBeNull();
  });
});
