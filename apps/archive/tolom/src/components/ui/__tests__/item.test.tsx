import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";

function renderItem(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Item", () => {
  it("renders with data-slot item", () => {
    const { $ } = renderItem(<Item>Content</Item>);
    expect($("[data-slot='item']")).toBeInTheDocument();
  });

  it("renders children text", () => {
    render(<Item>Hello World</Item>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { $ } = renderItem(<Item variant="default">Default</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    const { $ } = renderItem(<Item variant="outline">Outline</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("renders with muted variant", () => {
    const { $ } = renderItem(<Item variant="muted">Muted</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("renders with default size", () => {
    const { $ } = renderItem(<Item size="default">Default Size</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    const { $ } = renderItem(<Item size="sm">SM</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("renders with xs size", () => {
    const { $ } = renderItem(<Item size="xs">XS</Item>);
    const el = $("[data-slot='item']");
    expect(el).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderItem(<Item className="custom-item">Custom</Item>);
    expect($("[data-slot='item']")?.className).toContain("custom-item");
  });

  it("renders as a different element via render prop", () => {
    const { $ } = renderItem(
      <Item render={<a href="/test" />}>Link Item</Item>,
    );
    const el = $("[data-slot='item']");
    expect(el?.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "/test");
  });
});

describe("ItemGroup", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(
      <ItemGroup>
        <Item>One</Item>
      </ItemGroup>,
    );
    expect($("[data-slot='item-group']")).toBeInTheDocument();
  });

  it("renders as ul element", () => {
    const { $ } = renderItem(
      <ItemGroup>
        <Item>One</Item>
      </ItemGroup>,
    );
    expect($("[data-slot='item-group']")?.tagName).toBe("UL");
  });
});

describe("ItemContent", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemContent>Content</ItemContent>);
    expect($("[data-slot='item-content']")).toBeInTheDocument();
  });
});

describe("ItemTitle", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemTitle>Title</ItemTitle>);
    expect($("[data-slot='item-title']")).toBeInTheDocument();
  });

  it("renders children text", () => {
    render(<ItemTitle>Customer Name</ItemTitle>);
    expect(screen.getByText("Customer Name")).toBeInTheDocument();
  });
});

describe("ItemDescription", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemDescription>Desc</ItemDescription>);
    expect($("[data-slot='item-description']")).toBeInTheDocument();
  });

  it("renders as p element", () => {
    render(<ItemDescription>Some detail text</ItemDescription>);
    const desc = screen.getByText("Some detail text");
    expect(desc.tagName).toBe("P");
  });
});

describe("ItemMedia", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(
      <ItemMedia>
        <span>icon</span>
      </ItemMedia>,
    );
    expect($("[data-slot='item-media']")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { $ } = renderItem(<ItemMedia variant="default">M</ItemMedia>);
    expect($("[data-slot='item-media']")).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it("renders with icon variant", () => {
    const { $ } = renderItem(<ItemMedia variant="icon">M</ItemMedia>);
    expect($("[data-slot='item-media']")).toHaveAttribute(
      "data-variant",
      "icon",
    );
  });
});

describe("ItemActions", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(
      <ItemActions>
        <button type="button">Action</button>
      </ItemActions>,
    );
    expect($("[data-slot='item-actions']")).toBeInTheDocument();
  });
});

describe("ItemHeader", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemHeader>Header</ItemHeader>);
    expect($("[data-slot='item-header']")).toBeInTheDocument();
  });
});

describe("ItemFooter", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemFooter>Footer</ItemFooter>);
    expect($("[data-slot='item-footer']")).toBeInTheDocument();
  });
});

describe("ItemSeparator", () => {
  it("renders with data-slot", () => {
    const { $ } = renderItem(<ItemSeparator />);
    expect($("[data-slot='item-separator']")).toBeInTheDocument();
  });

  it("renders horizontal separator", () => {
    const { $ } = renderItem(<ItemSeparator />);
    const sep = $("[data-slot='item-separator']");
    expect(sep).toBeInTheDocument();
  });
});

describe("Item integration", () => {
  it("renders complete item with all sub-components", () => {
    render(
      <Item>
        <ItemMedia variant="icon">
          <span aria-hidden="true">*</span>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Main Title</ItemTitle>
          <ItemDescription>Description text</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Edit</button>
        </ItemActions>
      </Item>,
    );
    expect(screen.getByText("Main Title")).toBeInTheDocument();
    expect(screen.getByText("Description text")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
