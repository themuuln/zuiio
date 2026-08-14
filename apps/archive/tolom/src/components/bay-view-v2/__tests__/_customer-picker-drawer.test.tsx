import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { CustomerPickerDrawer } from "../_customer-picker-drawer";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const mocks = vi.hoisted(() => {
  const useCustomers = vi.fn();
  return { useCustomers };
});

vi.mock("@/lib/queries/use-customers", () => ({
  useCustomers: mocks.useCustomers,
}));

vi.mock("@/components/ui/picker-drawer", () => ({
  PickerDrawer: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="picker-drawer">
        {title}
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/search-input", () => ({
  SearchInput: ({ onSearch }: { onSearch: (q: string) => void }) => (
    <input aria-label="search" onChange={(e) => onSearch(e.target.value)} />
  ),
}));

vi.mock("@/components/customers/quick-create-customer-drawer", () => ({
  QuickCreateCustomerDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="quick-create">quick</div> : null,
}));

const customer = {
  id: "c-1",
  first_name: "Дорж",
  last_name: "Бат",
  phone: "99112233",
};

describe("CustomerPickerDrawer", () => {
  it("renders nothing while closed", () => {
    mocks.useCustomers.mockReturnValue({ data: [], isFetching: false });
    render(
      <CustomerPickerDrawer
        orgId="org-1"
        open={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("picker-drawer")).toBeNull();
  });

  it("searches and selects a customer", () => {
    mocks.useCustomers.mockReturnValue({ data: [customer], isFetching: false });
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CustomerPickerDrawer
        orgId="org-1"
        open
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText("search"), {
      target: { value: "Дорж" },
    });
    expect(mocks.useCustomers).toHaveBeenCalledWith("org-1", "Дорж");
    expect(screen.getByText("Дорж Бат")).toBeTruthy();
    expect(screen.getByText("99112233")).toBeTruthy();
    fireEvent.click(screen.getByText("Дорж Бат"));
    expect(onSelect).toHaveBeenCalledWith(customer);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the no-results empty state", () => {
    mocks.useCustomers.mockReturnValue({ data: [], isFetching: false });
    render(
      <CustomerPickerDrawer
        orgId="org-1"
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("search"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("noCustomersFound")).toBeTruthy();
  });

  it("opens the quick-create drawer", () => {
    mocks.useCustomers.mockReturnValue({ data: [], isFetching: false });
    render(
      <CustomerPickerDrawer
        orgId="org-1"
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle("quickCreateCustomer"));
    expect(screen.getByTestId("quick-create")).toBeTruthy();
  });
});
