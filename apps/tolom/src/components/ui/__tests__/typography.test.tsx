import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Typography } from "@/components/ui/typography";

describe("Typography", () => {
  it("renders H1-H4 with the right heading tags", () => {
    const { container } = render(
      <>
        <Typography.H1>Heading 1</Typography.H1>
        <Typography.H2>Heading 2</Typography.H2>
        <Typography.H3>Heading 3</Typography.H3>
        <Typography.H4>Heading 4</Typography.H4>
      </>,
    );
    expect(container.querySelector("h1")?.textContent).toBe("Heading 1");
    expect(container.querySelector("h2")?.textContent).toBe("Heading 2");
    expect(container.querySelector("h3")?.textContent).toBe("Heading 3");
    expect(container.querySelector("h4")?.textContent).toBe("Heading 4");
  });

  it("renders P, Lead and Muted as paragraphs", () => {
    const { container } = render(
      <>
        <Typography.P>Body text</Typography.P>
        <Typography.Lead>Lead text</Typography.Lead>
        <Typography.Muted>Muted text</Typography.Muted>
      </>,
    );
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toHaveTextContent("Body text");
    expect(paragraphs[1]).toHaveTextContent("Lead text");
    expect(paragraphs[2]).toHaveTextContent("Muted text");
  });

  it("renders Small as <small> and InlineCode as <code>", () => {
    const { container } = render(
      <>
        <Typography.Small>Small text</Typography.Small>
        <Typography.InlineCode>const x = 1</Typography.InlineCode>
      </>,
    );
    const small = container.querySelector("small");
    expect(small?.textContent).toBe("Small text");
    const code = container.querySelector("code");
    expect(code?.textContent).toBe("const x = 1");
    expect(code?.className).toContain("font-mono");
  });

  it("renders Blockquote and Large with their tags", () => {
    const { container } = render(
      <>
        <Typography.Blockquote>quote</Typography.Blockquote>
        <Typography.Large>big</Typography.Large>
      </>,
    );
    const blockquote = container.querySelector("blockquote");
    expect(blockquote?.textContent).toBe("quote");
    expect(container.querySelector("div")?.textContent).toBe("big");
  });

  it("renders an unordered list by default", () => {
    const { container } = render(
      <Typography.List>
        <li>One</li>
        <li>Two</li>
      </Typography.List>,
    );
    const list = container.querySelector("ul");
    expect(list).toBeInTheDocument();
    expect(list?.className).toContain("list-disc");
    expect(list?.textContent).toContain("One");
  });

  it("renders an ordered list with variant ol", () => {
    const { container } = render(
      <Typography.List variant="ol">
        <li>First</li>
      </Typography.List>,
    );
    const list = container.querySelector("ol");
    expect(list).toBeInTheDocument();
    expect(list?.className).toContain("list-decimal");
  });

  it("renders Text with a plain paragraph", () => {
    const { container } = render(<Typography.Text>Plain</Typography.Text>);
    const p = container.querySelector("p");
    expect(p?.textContent).toBe("Plain");
  });

  it("applies custom className to every variant", () => {
    const { container } = render(
      <>
        <Typography.H1 className="custom-h1">H</Typography.H1>
        <Typography.P className="custom-p">P</Typography.P>
        <Typography.Muted className="custom-muted">M</Typography.Muted>
        <Typography.Small className="custom-small">S</Typography.Small>
        <Typography.Blockquote className="custom-quote">
          Q
        </Typography.Blockquote>
      </>,
    );
    expect(container.querySelector("h1")?.className).toContain("custom-h1");
    expect(container.querySelector("p")?.className).toContain("custom-p");
    expect(container.querySelectorAll("p")[1]?.className).toContain(
      "custom-muted",
    );
    expect(container.querySelector("small")?.className).toContain(
      "custom-small",
    );
    expect(container.querySelector("blockquote")?.className).toContain(
      "custom-quote",
    );
  });

  it("forwards aria props", () => {
    render(<Typography.H1 aria-label="aria heading">Visible</Typography.H1>);
    expect(screen.getByLabelText("aria heading")).toBeInTheDocument();
  });
});
