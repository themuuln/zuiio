import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ThemeProvider from "@/components/theme-provider";

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider>
        <div>Child content</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(
      <ThemeProvider>
        <span>Test</span>
      </ThemeProvider>,
    );
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
