import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function renderCard(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Card", () => {
  it("renders with default size", () => {
    const { $ } = renderCard(<Card>Content</Card>);
    const card = $("[data-slot='card']");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-size", "default");
  });

  it("renders with sm size", () => {
    const { $ } = renderCard(<Card size="sm">Small card</Card>);
    expect($("[data-slot='card']")).toHaveAttribute("data-size", "sm");
  });

  it("renders CardHeader", () => {
    const { $ } = renderCard(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>,
    );
    expect($("[data-slot='card-header']")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(
      <Card>
        <CardTitle>Title here</CardTitle>
      </Card>,
    );
    const title = screen.getByText("Title here");
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute("data-slot", "card-title");
  });

  it("renders CardDescription", () => {
    render(
      <Card>
        <CardDescription>Description</CardDescription>
      </Card>,
    );
    const desc = screen.getByText("Description");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveAttribute("data-slot", "card-description");
  });

  it("renders CardContent", () => {
    render(
      <Card>
        <CardContent>Content body</CardContent>
      </Card>,
    );
    const content = screen.getByText("Content body");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-slot", "card-content");
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
  });

  it("renders CardAction", () => {
    const { $ } = renderCard(
      <Card>
        <CardAction>
          <button type="button">Action</button>
        </CardAction>
      </Card>,
    );
    expect($("[data-slot='card-action']")).toBeInTheDocument();
  });

  it("applies custom className on Card", () => {
    const { $ } = renderCard(<Card className="custom-card">Card</Card>);
    expect($("[data-slot='card']")?.className).toContain("custom-card");
  });

  it("passes additional props", () => {
    render(<Card data-testid="test-card">Card</Card>);
    expect(screen.getByTestId("test-card")).toBeInTheDocument();
  });
});
