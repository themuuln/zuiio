import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QueryProvider from "@/components/query-provider";

describe("QueryProvider", () => {
  it("renders children", () => {
    render(
      <QueryProvider>
        <div>Test child</div>
      </QueryProvider>,
    );
    expect(screen.getByText("Test child")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(
      <QueryProvider>
        <span>Content</span>
      </QueryProvider>,
    );
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
