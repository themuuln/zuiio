import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function renderPagination(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Pagination", () => {
  it("renders a nav with data-slot pagination", () => {
    const { $ } = renderPagination(<Pagination />);
    const nav = $("[data-slot='pagination']");
    expect(nav).toBeInTheDocument();
    expect(nav?.tagName).toBe("NAV");
  });

  it("has aria-label pagination", () => {
    render(<Pagination />);
    expect(screen.getByLabelText("pagination")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderPagination(<Pagination className="custom-nav" />);
    expect($("[data-slot='pagination']")?.className).toContain("custom-nav");
  });
});

describe("PaginationContent", () => {
  it("renders a ul with data-slot pagination-content", () => {
    const { $ } = renderPagination(<PaginationContent />);
    const ul = $("[data-slot='pagination-content']");
    expect(ul).toBeInTheDocument();
    expect(ul?.tagName).toBe("UL");
  });
});

describe("PaginationItem", () => {
  it("renders an li with data-slot pagination-item", () => {
    const { $ } = renderPagination(<PaginationItem />);
    const li = $("[data-slot='pagination-item']");
    expect(li).toBeInTheDocument();
    expect(li?.tagName).toBe("LI");
  });
});

describe("PaginationLink", () => {
  it("renders a link with data-slot pagination-link", () => {
    const { $ } = renderPagination(
      <PaginationLink href="/page/1">1</PaginationLink>,
    );
    expect($("[data-slot='pagination-link']")).toBeInTheDocument();
  });

  it("renders as active with data-active and aria-current", () => {
    render(
      <PaginationLink href="/page/1" isActive data-testid="active-link">
        1
      </PaginationLink>,
    );
    const link = screen.getByTestId("active-link");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveAttribute("data-active", "true");
  });

  it("renders as inactive without aria-current", () => {
    const { $ } = renderPagination(
      <PaginationLink href="/page/2">2</PaginationLink>,
    );
    const link = $("[data-slot='pagination-link']");
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("renders children as link text", () => {
    render(<PaginationLink href="/page/3">3</PaginationLink>);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("PaginationPrevious", () => {
  it("renders with aria-label Go to previous page", () => {
    render(<PaginationPrevious href="/page/1" />);
    expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
  });

  it("renders Previous text by default", () => {
    render(<PaginationPrevious href="/page/1" />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
  });

  it("renders custom text", () => {
    render(<PaginationPrevious text="Prev" href="/page/1" />);
    expect(screen.getByText("Prev")).toBeInTheDocument();
  });

  it("renders chevron left icon", () => {
    const { $ } = renderPagination(<PaginationPrevious href="/page/1" />);
    // ChevronLeftIcon with data-icon="inline-start"
    expect($("[data-icon='inline-start']")).toBeInTheDocument();
  });
});

describe("PaginationNext", () => {
  it("renders with aria-label Go to next page", () => {
    render(<PaginationNext href="/page/2" />);
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
  });

  it("renders Next text by default", () => {
    render(<PaginationNext href="/page/2" />);
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("renders custom text", () => {
    render(<PaginationNext text="Suivant" href="/page/2" />);
    expect(screen.getByText("Suivant")).toBeInTheDocument();
  });

  it("renders chevron right icon", () => {
    const { $ } = renderPagination(<PaginationNext href="/page/2" />);
    expect($("[data-icon='inline-end']")).toBeInTheDocument();
  });
});

describe("PaginationEllipsis", () => {
  it("renders a span with data-slot pagination-ellipsis", () => {
    const { $ } = renderPagination(<PaginationEllipsis />);
    const span = $("[data-slot='pagination-ellipsis']");
    expect(span).toBeInTheDocument();
    expect(span?.tagName).toBe("SPAN");
  });

  it("is aria-hidden", () => {
    const { $ } = renderPagination(<PaginationEllipsis />);
    expect($("[data-slot='pagination-ellipsis']")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("has a sr-only More pages label", () => {
    render(<PaginationEllipsis />);
    expect(screen.getByText("More pages")).toBeInTheDocument();
  });
});

describe("Pagination integration", () => {
  it("renders a full pagination component", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/0" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/1" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/2" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByLabelText("pagination")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("More pages")).toBeInTheDocument();
  });
});
