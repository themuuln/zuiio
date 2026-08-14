import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NuqsProvider from "@/components/nuqs-provider";

describe("NuqsProvider", () => {
  it("renders children inside the nuqs adapter", () => {
    render(
      <NuqsProvider>
        <div>app content</div>
      </NuqsProvider>,
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
  });
});
