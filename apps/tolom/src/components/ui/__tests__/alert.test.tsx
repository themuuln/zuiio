import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

function renderAlert(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Alert", () => {
  it("renders with default variant", () => {
    render(<Alert>Alert content</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("data-slot", "alert");
  });

  it("renders with destructive variant", () => {
    render(<Alert variant="destructive">Destructive</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("renders AlertTitle", () => {
    render(
      <Alert>
        <AlertTitle>Title here</AlertTitle>
      </Alert>,
    );
    const title = screen.getByText("Title here");
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute("data-slot", "alert-title");
  });

  it("renders AlertDescription", () => {
    render(
      <Alert>
        <AlertDescription>Description text</AlertDescription>
      </Alert>,
    );
    const desc = screen.getByText("Description text");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveAttribute("data-slot", "alert-description");
  });

  it("renders AlertAction", () => {
    render(
      <Alert>
        <AlertAction>Action</AlertAction>
      </Alert>,
    );
    const action = screen.getByText("Action");
    expect(action).toBeInTheDocument();
    expect(action).toHaveAttribute("data-slot", "alert-action");
  });

  it("renders with title and description together", () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Something happened</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderAlert(
      <Alert className="custom-class">Styled alert</Alert>,
    );
    expect($("[data-slot='alert']")?.className).toContain("custom-class");
  });

  it("passes additional props", () => {
    render(<Alert data-testid="test-alert" />);
    expect(screen.getByTestId("test-alert")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <Alert>
        <span>Nested content</span>
      </Alert>,
    );
    expect(screen.getByText("Nested content")).toBeInTheDocument();
  });
});
