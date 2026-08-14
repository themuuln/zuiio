/**
 * Tests for PageShell component.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "../page-shell";

describe("PageShell", () => {
  it("renders children", () => {
    render(
      <PageShell>
        <div data-testid="child">Content</div>
      </PageShell>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("renders title when provided", () => {
    render(
      <PageShell title="Test Page">
        <div>Content</div>
      </PageShell>,
    );
    expect(screen.getByText("Test Page")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <PageShell title="Test" description="This is a test page">
        <div>Content</div>
      </PageShell>,
    );
    expect(screen.getByText("This is a test page")).toBeDefined();
  });

  it("renders actions when provided", () => {
    render(
      <PageShell title="Test" actions={<button type="button">Action</button>}>
        <div>Content</div>
      </PageShell>,
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeDefined();
  });

  it("renders without crashing when minimal props provided", () => {
    render(<PageShell>Just content</PageShell>);
    expect(screen.getByText("Just content")).toBeDefined();
  });
});
