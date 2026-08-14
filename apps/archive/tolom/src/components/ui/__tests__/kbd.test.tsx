import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

function renderKbd(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Kbd", () => {
  it("renders with data-slot kbd", () => {
    const { $ } = renderKbd(<Kbd>⌘K</Kbd>);
    expect($("[data-slot='kbd']")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Kbd>Ctrl+S</Kbd>);
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderKbd(<Kbd className="custom-kbd">⌘K</Kbd>);
    expect($("[data-slot='kbd']")?.className).toContain("custom-kbd");
  });

  it("renders as kbd element", () => {
    const { $ } = renderKbd(<Kbd>Esc</Kbd>);
    expect($("[data-slot='kbd']")?.tagName).toBe("KBD");
  });
});

describe("KbdGroup", () => {
  it("renders with data-slot kbd-group", () => {
    const { $ } = renderKbd(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect($("[data-slot='kbd-group']")).toBeInTheDocument();
  });

  it("renders multiple Kbd children", () => {
    render(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByText("⌘")).toBeInTheDocument();
    expect(screen.getByText("Shift")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderKbd(
      <KbdGroup className="custom-group">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect($("[data-slot='kbd-group']")?.className).toContain("custom-group");
  });
});
