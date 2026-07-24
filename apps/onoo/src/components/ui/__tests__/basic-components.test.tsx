import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

describe("Skeleton", () => {
  it("renders with default classes", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-slot", "skeleton");
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("rounded-md");
  });

  it("renders with custom className", () => {
    const { container } = render(<Skeleton className="w-10 h-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("w-10");
    expect(el.className).toContain("h-10");
  });
});

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Danger</Badge>);
    const badge = screen.getByText("Danger");
    expect(badge).toBeInTheDocument();
  });
});

describe("Button", () => {
  it("renders as button by default", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("data-slot", "button");
    expect(btn).toHaveAttribute("data-variant", "default");
    expect(btn).toHaveAttribute("data-size", "default");
  });

  it("renders with custom variant and size", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toHaveAttribute("data-variant", "destructive");
    expect(btn).toHaveAttribute("data-size", "lg");
  });

  it("renders as link when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("forwards click handler", async () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Click</Button>);
    const btn = screen.getByRole("button");
    btn.click();
    expect(clicked).toBe(true);
  });

  it("disables button", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });
});

describe("Separator", () => {
  it("renders horizontal by default", () => {
    const { container } = render(<Separator />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-slot", "separator");
  });
});

describe("Input", () => {
  it("renders with default type", () => {
    render(<Input />);
    const el = screen.getByRole("textbox") as HTMLInputElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-slot", "input");
    expect(el.type).toBe("text");
  });

  it("renders with custom type and placeholder", () => {
    render(<Input type="email" placeholder="Email" />);
    const el = screen.getByPlaceholderText("Email") as HTMLInputElement;
    expect(el.type).toBe("email");
  });

  it("forwards disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("Label", () => {
  it("renders with text", () => {
    render(<Label>Name</Label>);
    const el = screen.getByText("Name");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-slot", "label");
  });

  it("renders htmlFor attribute", () => {
    render(<Label htmlFor="name-input">Name</Label>);
    const el = screen.getByText("Name");
    expect(el).toHaveAttribute("for", "name-input");
  });
});

describe("Textarea", () => {
  it("renders with placeholder", () => {
    render(<Textarea placeholder="Write..." />);
    const el = screen.getByPlaceholderText("Write...");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-slot", "textarea");
  });

  it("forwards value", () => {
    render(<Textarea defaultValue="Hello" />);
    const el = screen.getByDisplayValue("Hello");
    expect(el).toBeInTheDocument();
  });
});
