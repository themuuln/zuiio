import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function renderBreadcrumb(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Breadcrumb", () => {
  it("renders nav with aria-label", () => {
    const { $ } = renderBreadcrumb(<Breadcrumb />);
    const nav = $("[data-slot='breadcrumb']");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("aria-label", "breadcrumb");
  });

  it("renders BreadcrumbList", () => {
    const { $ } = renderBreadcrumb(
      <Breadcrumb>
        <BreadcrumbList />
      </Breadcrumb>,
    );
    expect($("[data-slot='breadcrumb-list']")).toBeInTheDocument();
  });

  it("renders BreadcrumbItem", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>Home</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const item = screen.getByText("Home");
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute("data-slot", "breadcrumb-item");
  });

  it("renders BreadcrumbLink", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/home">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const link = screen.getByText("Home");
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/home");
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("renders BreadcrumbPage (current page)", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const page = screen.getByText("Current");
    expect(page).toBeInTheDocument();
    expect(page).toHaveAttribute("aria-current", "page");
    expect(page).toHaveAttribute("data-slot", "breadcrumb-page");
  });

  it("renders BreadcrumbSeparator", () => {
    const { $ } = renderBreadcrumb(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>One</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Two</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const sep = $("[data-slot='breadcrumb-separator']");
    expect(sep).toBeInTheDocument();
    expect(sep).toHaveAttribute("aria-hidden", "true");
  });

  it("renders BreadcrumbEllipsis", () => {
    const { $ } = renderBreadcrumb(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbEllipsis />
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const ellipsis = $("[data-slot='breadcrumb-ellipsis']");
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderBreadcrumb(<Breadcrumb className="custom" />);
    expect($("[data-slot='breadcrumb']")?.className).toContain("custom");
  });
});
