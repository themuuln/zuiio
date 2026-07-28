import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchForm } from "@/components/search-form";
import { render } from "@/test/test-utils";

const messages = {
  common: {
    search: "Хайх",
    typeToSearch: "Бичиж хайх...",
  },
};

describe("SearchForm", () => {
  it("renders search input with placeholder from translation", () => {
    render(<SearchForm />, { messages });
    const input = screen.getByPlaceholderText("Бичиж хайх...");
    expect(input).toBeInTheDocument();
  });

  it("renders search label with screen-reader-only text", () => {
    render(<SearchForm />, { messages });
    const label = screen.getByText("Хайх");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("sr-only");
  });

  it("renders SearchIcon", () => {
    const { container } = render(<SearchForm />, { messages });
    expect(container.querySelector(".lucide-search")).toBeInTheDocument();
  });

  it("applies form-level props via spread", () => {
    const onSubmit = () => {};
    const { container } = render(
      <SearchForm
        data-testid="search-form"
        className="custom-class"
        onSubmit={onSubmit}
        aria-label="test"
      />,
      { messages },
    );
    const form = container.querySelector('[data-testid="search-form"]');
    expect(form).toHaveClass("custom-class");
    expect(form).toHaveAttribute("aria-label", "test");
  });

  it("renders SidebarInput with correct id", () => {
    render(<SearchForm />, { messages });
    const input = screen.getByPlaceholderText("Бичиж хайх...");
    expect(input).toHaveAttribute("id", "search");
  });

  it("renders form element as wrapper", () => {
    const { container } = render(<SearchForm />, { messages });
    expect(container.querySelector("form")).toBeInTheDocument();
  });

  it("forwards additional HTML form attributes", () => {
    render(<SearchForm role="search" autoComplete="off" />, { messages });
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("autocomplete", "off");
  });
});
