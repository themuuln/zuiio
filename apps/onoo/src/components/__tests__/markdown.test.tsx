import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";

describe("Markdown", () => {
  it("renders article wrapper for empty string", () => {
    const { container } = render(<Markdown content="" />);
    expect(container.querySelector("article")).toBeInTheDocument();
  });

  it("renders h1 from # heading", () => {
    render(<Markdown content="# Title" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Title",
    );
  });

  it("renders h2 from ## heading", () => {
    render(<Markdown content="## Section" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Section",
    );
  });

  it("renders h3 from ### heading", () => {
    render(<Markdown content="### Subsection" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Subsection",
    );
  });

  it("renders paragraph text", () => {
    render(<Markdown content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold text", () => {
    render(<Markdown content="This is **bold** text" />);
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("renders links as anchor elements", () => {
    render(<Markdown content="[click here](https://example.com)" />);
    const link = screen.getByRole("link", { name: "click here" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders unordered lists", () => {
    const { container } = render(
      <Markdown content="- item 1\n- item 2\n- item 3" />,
    );
    const article = container.querySelector("article");
    expect(article?.textContent).toContain("item 1");
    expect(article?.textContent).toContain("item 2");
    expect(article?.textContent).toContain("item 3");
  });

  it("renders ordered lists", () => {
    const { container } = render(<Markdown content="1. first\n2. second" />);
    const article = container.querySelector("article");
    expect(article?.textContent).toContain("first");
    expect(article?.textContent).toContain("second");
  });

  it("renders code blocks", () => {
    render(<Markdown content="```\nconst x = 1;\n```" />);
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
  });

  it("renders inline code", () => {
    render(<Markdown content="Use the `fn()` call" />);
    expect(screen.getByText("fn()")).toBeInTheDocument();
  });
});
