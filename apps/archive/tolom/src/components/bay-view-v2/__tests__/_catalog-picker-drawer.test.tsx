import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { CatalogPickerDrawer } from "../_catalog-picker-drawer";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => "mn",
  };
});

vi.mock("@/components/ui/picker-drawer", () => ({
  PickerDrawer: ({
    open,
    title,
    description,
    children,
  }: {
    open: boolean;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="picker-drawer">
        <span>{title}</span>
        {description ? <span>{description}</span> : null}
        {children}
      </div>
    ) : null,
}));

const item = {
  id: "s-1",
  name: "Oil change",
  name_mn: "Тос солих",
  default_price: 30000,
};

describe("CatalogPickerDrawer", () => {
  it("renders nothing while closed", () => {
    render(
      <CatalogPickerDrawer
        open={false}
        onOpenChange={vi.fn()}
        items={[item]}
        search=""
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        onAddNew={vi.fn()}
        isAdded={() => false}
        placeholder="Search"
        noMatchMessage="No match"
        addAsNewLabel="Add new"
        filterAllLabel="All"
        title="Pick a service"
      />,
    );
    expect(screen.queryByTestId("picker-drawer")).toBeNull();
  });

  it("renders the title and the combobox with mn names", () => {
    render(
      <CatalogPickerDrawer
        open
        onOpenChange={vi.fn()}
        items={[item]}
        search=""
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        onAddNew={vi.fn()}
        isAdded={() => false}
        placeholder="Search"
        noMatchMessage="No match"
        addAsNewLabel="Add new"
        filterAllLabel="All"
        title="Pick a service"
      />,
    );
    expect(screen.getByText("Pick a service")).toBeTruthy();
    expect(screen.getByText("Тос солих")).toBeTruthy();
  });

  it("selects an item through the combobox", () => {
    const onSelect = vi.fn();
    render(
      <CatalogPickerDrawer
        open
        onOpenChange={vi.fn()}
        items={[item]}
        search=""
        onSearchChange={vi.fn()}
        onSelect={onSelect}
        onAddNew={vi.fn()}
        isAdded={() => false}
        placeholder="Search"
        noMatchMessage="No match"
        addAsNewLabel="Add new"
        filterAllLabel="All"
        title="Pick a service"
      />,
    );
    fireEvent.click(screen.getByText("Тос солих"));
    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
