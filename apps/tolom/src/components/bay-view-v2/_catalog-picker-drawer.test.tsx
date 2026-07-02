import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const catalogItems = [
  {
    id: "svc-1",
    name: "Oil Change",
    name_mn: null,
    default_price: 65000,
  },
  {
    id: "svc-2",
    name: "Brake Service",
    name_mn: null,
    default_price: 120000,
  },
];

function TestDrawer({
  onSelect = vi.fn(),
  onAddNew = vi.fn(),
}: {
  onSelect?: (item: (typeof catalogItems)[number]) => void;
  onAddNew?: (name: string) => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <CatalogPickerDrawer
      open
      onOpenChange={() => {}}
      title="Add Service"
      description="Search the service catalog."
      items={catalogItems}
      search={search}
      onSearchChange={setSearch}
      onSelect={onSelect}
      onAddNew={onAddNew}
      isAdded={() => false}
      placeholder="Search services..."
      noMatchMessage="No services match"
      addAsNewLabel="Add as new"
      closeLabel="Close"
    />
  );
}

describe("CatalogPickerDrawer", () => {
  it("renders inline results and calls onSelect", async () => {
    const onSelect = vi.fn();

    render(<TestDrawer onSelect={onSelect} />);

    await userEvent.type(
      screen.getByPlaceholderText("Search services..."),
      "oil",
    );

    const result = await screen.findByText("Oil Change");
    await userEvent.click(result);

    expect(onSelect).toHaveBeenCalledWith(catalogItems[0]);
  });

  it("supports adding a custom catalog item", async () => {
    const onAddNew = vi.fn();

    render(<TestDrawer onAddNew={onAddNew} />);

    await userEvent.type(
      screen.getByPlaceholderText("Search services..."),
      "Alignment",
    );

    await userEvent.click(screen.getByText(/Add as new/i));

    expect(onAddNew).toHaveBeenCalledWith("Alignment");
  });
});
