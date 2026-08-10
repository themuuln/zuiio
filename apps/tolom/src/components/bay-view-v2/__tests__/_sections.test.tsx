import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PartsSection } from "../_parts-section";
import { ServicesSection } from "../_services-section";

// Fake LineItemRow that renders the display name (mn-aware) and forwards
// edit callbacks — keeps these tests focused on section behavior.
vi.mock("@/components/work-orders/line-items", () => ({
  LineItemRow: ({
    name,
    nameMn,
    quantity,
    unitPrice,
    lineItemId,
    onEditPriceSave,
    onEditQtySave,
    autoFocusPrice,
  }: {
    name: string;
    nameMn?: string | null;
    quantity: number;
    unitPrice: number;
    lineItemId?: string;
    onEditPriceSave?: (id: string, price: number) => Promise<void>;
    onEditQtySave?: (id: string, qty: number) => Promise<void>;
    autoFocusPrice?: boolean;
  }) => (
    <div data-testid={`line-${lineItemId}`} data-autofocus={autoFocusPrice}>
      <span>{nameMn && nameMn !== name ? nameMn : name}</span>
      <button
        type="button"
        onClick={() => onEditQtySave?.(String(lineItemId), quantity)}
      >
        qty
      </button>
      <button
        type="button"
        onClick={() => onEditPriceSave?.(String(lineItemId), unitPrice)}
      >
        price
      </button>
    </div>
  ),
}));

const t = (key: string) => key;

describe("ServicesSection", () => {
  it("renders the empty state when there are no services", () => {
    render(
      <ServicesSection
        services={[]}
        catalog={[]}
        onAddServiceOpenChange={vi.fn()}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("noServicesYet")).toBeTruthy();
  });

  it("renders service rows and opens the add flow", () => {
    const onAddServiceOpenChange = vi.fn();
    render(
      <ServicesSection
        services={[
          {
            id: "s-1",
            service_name: "Oil change",
            quantity: 1,
            unit_price: 30000,
            final_price: 30000,
            discount_amount: null,
            discount_percentage: null,
          } as never,
        ]}
        catalog={[]}
        onAddServiceOpenChange={onAddServiceOpenChange}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("Oil change")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /addService/ }));
    expect(onAddServiceOpenChange).toHaveBeenCalledWith(true);
  });

  it("resolves Mongolian names from the catalog in mn locale", () => {
    render(
      <ServicesSection
        services={[
          {
            id: "s-1",
            service_name: "Oil change",
            service_catalog_id: "cat-1",
            quantity: 1,
            unit_price: 30000,
            final_price: 30000,
            discount_amount: null,
            discount_percentage: null,
          } as never,
        ]}
        catalog={[
          { id: "cat-1", name: "Oil change", name_mn: "Тос солих" } as never,
        ]}
        locale="mn"
        onAddServiceOpenChange={vi.fn()}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("Тос солих")).toBeTruthy();
  });

  it("shows the service count badge", () => {
    render(
      <ServicesSection
        services={[
          {
            id: "s-1",
            service_name: "Oil change",
            quantity: 1,
            unit_price: 30000,
            final_price: 30000,
            discount_amount: null,
            discount_percentage: null,
          } as never,
        ]}
        catalog={[]}
        onAddServiceOpenChange={vi.fn()}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("1")).toBeTruthy();
  });
});

describe("PartsSection", () => {
  it("renders the empty state when there are no parts", () => {
    render(
      <PartsSection
        parts={[]}
        partsCatalog={[]}
        onAddPartOpenChange={vi.fn()}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("noParts")).toBeTruthy();
  });

  it("renders part rows and opens the add flow", () => {
    const onAddPartOpenChange = vi.fn();
    render(
      <PartsSection
        parts={[
          {
            id: "p-1",
            part_name: "Oil filter",
            quantity: 2,
            unit_price: 15000,
            final_price: 30000,
            discount_amount: null,
            discount_percentage: null,
          } as never,
        ]}
        partsCatalog={[]}
        onAddPartOpenChange={onAddPartOpenChange}
        onEditPriceSave={vi.fn()}
        onEditQtySave={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("Oil filter")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /addPart/ }));
    expect(onAddPartOpenChange).toHaveBeenCalledWith(true);
  });

  it("forwards qty and price edits for a part row", async () => {
    const onEditQtySave = vi.fn().mockResolvedValue(undefined);
    const onEditPriceSave = vi.fn().mockResolvedValue(undefined);
    render(
      <PartsSection
        parts={[
          {
            id: "p-1",
            part_name: "Oil filter",
            quantity: 2,
            unit_price: 15000,
            final_price: 30000,
            discount_amount: null,
            discount_percentage: null,
          } as never,
        ]}
        partsCatalog={[]}
        onAddPartOpenChange={vi.fn()}
        onEditQtySave={onEditQtySave}
        onEditPriceSave={onEditPriceSave}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("qty"));
    expect(onEditQtySave).toHaveBeenCalledWith("p-1", 2);
    fireEvent.click(screen.getByText("price"));
    expect(onEditPriceSave).toHaveBeenCalledWith("p-1", 15000);
  });
});
