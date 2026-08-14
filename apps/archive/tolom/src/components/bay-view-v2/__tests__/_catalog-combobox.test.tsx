import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import type { CatalogItem } from "../_catalog-combobox";
import { CatalogCombobox } from "../_catalog-combobox";

const items: CatalogItem[] = [
  {
    id: "s-1",
    name: "Oil change",
    name_mn: "Тос солих",
    barcode: null,
    default_price: 30000,
    last_price: 35000,
    match_quality: "exact",
    category: "Oil Change",
  },
  {
    id: "s-2",
    name: "Brake pads",
    name_mn: null,
    barcode: "12345",
    default_price: 45000,
    last_price: null,
    match_quality: null,
    category: "Brakes",
  },
];

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    items,
    search: "",
    onSearchChange: vi.fn(),
    onSelect: vi.fn(),
    onAddNew: vi.fn(),
    isAdded: () => false,
    placeholder: "Search catalog",
    noMatchMessage: "No match",
    addAsNewLabel: "Add as new",
    locale: "en",
    resultsMode: "popover" as const,
    ...overrides,
  };
}

describe("CatalogCombobox (popover mode)", () => {
  it("renders the search input and item list", () => {
    render(<CatalogCombobox {...baseProps()} />);
    expect(screen.getByPlaceholderText("Search catalog")).toBeTruthy();
    expect(screen.getByText("Oil change")).toBeTruthy();
    expect(screen.getByText("₮ 35,000")).toBeTruthy();
  });

  it("filters items by search text", () => {
    render(<CatalogCombobox {...baseProps({ search: "brake" })} />);
    expect(screen.getByText("Brake pads")).toBeTruthy();
    expect(screen.queryByText("Oil change")).toBeNull();
  });

  it("matches search against Mongolian names and barcodes", () => {
    render(<CatalogCombobox {...baseProps({ search: "тос" })} />);
    expect(screen.getByText("Oil change")).toBeTruthy();
    render(<CatalogCombobox {...baseProps({ search: "12345" })} />);
    expect(screen.getByText("Brake pads")).toBeTruthy();
  });

  it("selects an item and clears the search", () => {
    const onSelect = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <CatalogCombobox
        {...baseProps({ onSelect, onSearchChange, search: "oil" })}
      />,
    );
    fireEvent.click(screen.getByText("Oil change"));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("disables already-added items", () => {
    render(
      <CatalogCombobox
        {...baseProps({
          isAdded: (item: CatalogItem) => item.id === "s-1",
        })}
      />,
    );
    expect(
      (screen.getByRole("button", { name: /Oil change/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("shows the no-match message and add-as-new action", () => {
    const onAddNew = vi.fn();
    render(<CatalogCombobox {...baseProps({ search: "zzz", onAddNew })} />);
    expect(screen.getByText("No match")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add as new/ }));
    expect(onAddNew).toHaveBeenCalledWith("zzz");
  });

  it("shows the Mongolian name in mn locale", () => {
    render(<CatalogCombobox {...baseProps({ locale: "mn" })} />);
    expect(screen.getByText("Тос солих")).toBeTruthy();
  });
});

describe("CatalogCombobox (inline mode)", () => {
  it("renders items grouped with category chips", () => {
    render(<CatalogCombobox {...baseProps({ resultsMode: "inline" })} />);
    expect(screen.getByText("Oil change")).toBeTruthy();
    expect(screen.getByText("Brake pads")).toBeTruthy();
    // Category chips: All + Oil Change + Brakes
    expect(screen.getByRole("button", { name: "Бүгд" })).toBeTruthy();
  });

  it("selects an item and clears the search in inline mode", () => {
    const onSelect = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <CatalogCombobox
        {...baseProps({
          resultsMode: "inline",
          onSelect,
          onSearchChange,
          search: "oil",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Oil change"));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("shows the add-as-new action from the empty state", () => {
    const onAddNew = vi.fn();
    render(
      <CatalogCombobox
        {...baseProps({
          resultsMode: "inline",
          search: "zzz",
          onAddNew,
          items: [],
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add as new/ }));
    expect(onAddNew).toHaveBeenCalledWith("zzz");
  });

  it("shows the catalog placeholder when there are no items and no search", () => {
    render(
      <CatalogCombobox {...baseProps({ resultsMode: "inline", items: [] })} />,
    );
    expect(screen.getByText("Search catalog")).toBeTruthy();
  });
});
