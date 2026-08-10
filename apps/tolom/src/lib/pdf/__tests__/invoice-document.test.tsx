import { screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { InvoiceWithItems } from "@/lib/types";
import { render } from "@/test/test-utils";
import { InvoiceDocument } from "../invoice-document";

// Mock the react-pdf primitives as plain DOM elements so the document
// tree can be rendered and asserted with @testing-library/react.
vi.mock("@react-pdf/renderer", () => {
  const view =
    (testId: string) =>
    ({ children, style }: { children?: React.ReactNode; style?: unknown }) =>
      React.createElement(
        "div",
        { "data-testid": testId, "data-style": JSON.stringify(style) },
        children,
      );
  return {
    Document: view("pdf-document"),
    Page: view("pdf-page"),
    View: view("pdf-view"),
    Text: ({
      children,
      style,
    }: {
      children?: React.ReactNode;
      style?: unknown;
    }) =>
      React.createElement(
        "span",
        { "data-testid": "pdf-text", "data-style": JSON.stringify(style) },
        children,
      ),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

const ORG = {
  name: "UB Auto Service",
  tax_id: "1234567",
};

function makeInvoice(overrides: Partial<InvoiceWithItems> = {}) {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "b1",
    invoice_number: "2026-0042",
    status: "partial",
    issued_at: "2026-08-01T12:00:00Z",
    due_at: "2026-08-15T12:00:00Z",
    customer_id: "cust-1",
    customer_name: "Bat Erdene",
    customer_phone: "+97699112233",
    customer_email: "bat@example.com",
    customer_address: "Ulaanbaatar",
    vehicle_id: null,
    vehicle_plate: "1234УБА",
    vehicle_details: "Toyota Prius 2019",
    work_order_id: null,
    subtotal: 120000,
    discount_total: 10000,
    tax_total: 24000,
    total: 134000,
    amount_paid: 50000,
    amount_refunded: 0,
    balance_due: 84000,
    footer: null,
    notes: "Thank you for your visit",
    terms: "Pay within 14 days",
    public_token: null,
    einvoice_status: null,
    einvoice_qr_code: null,
    einvoice_registration_id: null,
    einvoice_registered_at: null,
    email_sent_at: null,
    paid_at: null,
    created_at: "2026-08-01T12:00:00Z",
    updated_at: "2026-08-01T12:00:00Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    items: [
      {
        id: "item-1",
        invoice_id: "inv-1",
        item_type: "service",
        description: "Oil change",
        quantity: 1,
        unit_price: 50000,
        discount_amount: 0,
        total_price: 50000,
      },
      {
        id: "item-2",
        invoice_id: "inv-1",
        item_type: "service",
        description: "Belt replacement",
        quantity: 1,
        unit_price: 70000,
        discount_amount: 5000,
        total_price: 65000,
      },
      {
        id: "item-3",
        invoice_id: "inv-1",
        item_type: "part",
        description: "Oil filter",
        quantity: 2,
        unit_price: 15000,
        discount_amount: 10000,
        total_price: 20000,
      },
    ],
    payments: [
      {
        id: "pay-1",
        invoice_id: "inv-1",
        amount: 50000,
        method: "cash",
        paid_at: "2026-08-02T10:00:00Z",
        reference: "TXN-100",
        notes: null,
      },
    ],
    refunds: [],
    ...overrides,
  } as unknown as InvoiceWithItems;
}

describe("InvoiceDocument", () => {
  it("renders header, bill-to/vehicle, item rows and totals with exact sums", () => {
    render(
      <InvoiceDocument
        invoice={makeInvoice()}
        org={ORG}
        branch={{ address: "Bayangol District", phone: "+97670001111" }}
        locale="mn"
      />,
    );

    // Header: org, tax id, invoice meta
    expect(screen.getByText("UB Auto Service")).toBeInTheDocument();
    expect(screen.getByText("Bayangol District")).toBeInTheDocument();
    expect(screen.getByText("Tel: +97670001111")).toBeInTheDocument();
    expect(screen.getByText("Регистрийн дугаар: 1234567")).toBeInTheDocument();
    expect(screen.getByText("НЭХЭЛГЭЭ")).toBeInTheDocument();
    expect(screen.getByText("2026-0042")).toBeInTheDocument();
    expect(screen.getByText(/01 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText(/15 Aug 2026/)).toBeInTheDocument();

    // Bill-to + vehicle
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    expect(screen.getByText("+97699112233")).toBeInTheDocument();
    expect(screen.getByText("bat@example.com")).toBeInTheDocument();
    expect(screen.getByText("Ulaanbaatar")).toBeInTheDocument();
    expect(screen.getByText("1234УБА")).toBeInTheDocument();
    expect(screen.getByText("Toyota Prius 2019")).toBeInTheDocument();

    // Item rows: type labels (two services → two SVC cells), discounts, line totals
    expect(screen.getAllByText("SVC").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("PRT")).toBeInTheDocument();
    expect(screen.getByText("Oil change")).toBeInTheDocument();
    expect(screen.getByText("Belt replacement")).toBeInTheDocument();
    expect(screen.getByText("Oil filter")).toBeInTheDocument();
    expect(screen.getByText("-₮5,000")).toBeInTheDocument();
    // item-3's discount column (also appears in the totals discount row)
    expect(screen.getAllByText("-₮10,000").length).toBeGreaterThanOrEqual(2);

    // Category subtotals: services 50k+65k, parts 20k (line total also 20k)
    expect(screen.getByText("₮115,000")).toBeInTheDocument();
    expect(screen.getAllByText("₮20,000").length).toBeGreaterThanOrEqual(2);

    // Totals: subtotal, discount (also shown per-item), VAT, grand total
    expect(screen.getByText("₮120,000")).toBeInTheDocument();
    expect(screen.getByText("₮24,000")).toBeInTheDocument();
    expect(screen.getByText("₮134,000")).toBeInTheDocument();

    // Amount paid (line total for item-1 is also ₮50,000)
    expect(screen.getAllByText("₮50,000").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("₮84,000")).toBeInTheDocument();

    // Payment history
    expect(screen.getByText(/02 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText("Бэлэн")).toBeInTheDocument();
    expect(screen.getByText("TXN-100")).toBeInTheDocument();

    // Notes, terms, footer fallback
    expect(screen.getByText("Thank you for your visit")).toBeInTheDocument();
    expect(screen.getByText("Pay within 14 days")).toBeInTheDocument();
    expect(
      screen.getByText("Хамтран ажилласанд баярлалаа — UB Auto Service"),
    ).toBeInTheDocument();
  });

  it("colors the balance due destructively when positive and uses the custom footer", () => {
    render(
      <InvoiceDocument
        invoice={makeInvoice({ footer: "Custom footer line" })}
        org={ORG}
        locale="en"
      />,
    );

    expect(screen.getByText("₮84,000").getAttribute("data-style")).toContain(
      "#dc2626",
    );
    expect(screen.getByText("Custom footer line")).toBeInTheDocument();
    expect(
      screen.queryByText("Thank you for your business — UB Auto Service"),
    ).not.toBeInTheDocument();
  });

  it("maps payment methods to English labels and falls back for unknown ones", () => {
    render(
      <InvoiceDocument
        invoice={makeInvoice({
          payments: [
            {
              id: "pay-1",
              invoice_id: "inv-1",
              amount: 50000,
              method: "bank_transfer",
              paid_at: "2026-08-02T10:00:00Z",
              reference: null,
              notes: null,
            },
            {
              id: "pay-2",
              invoice_id: "inv-1",
              amount: 10000,
              method: "store_credit",
              paid_at: "2026-08-03T10:00:00Z",
              reference: null,
              notes: null,
            },
          ],
        })}
        org={ORG}
        locale="en"
      />,
    );

    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    // Unknown method → underscores replaced with spaces
    expect(screen.getByText("store credit")).toBeInTheDocument();
    // Dashes: the zero-discount item row plus the two null payment references
    expect(screen.getAllByText("—").length).toBe(3);
  });

  it("handles a walk-in customer, empty items, no payments and no balance rows", () => {
    render(
      <InvoiceDocument
        invoice={makeInvoice({
          customer_name: null,
          customer_phone: null,
          customer_email: null,
          customer_address: null,
          vehicle_plate: null,
          vehicle_details: null,
          items: [],
          payments: [],
          amount_paid: 0,
          balance_due: 134000,
          discount_total: 0,
          tax_total: 0,
          notes: null,
          terms: null,
          due_at: null,
        })}
        org={{ name: "UB Auto Service" }}
        locale="en"
      />,
    );

    // Walk-in placeholder
    expect(screen.getByText("Walk-in Customer")).toBeInTheDocument();
    expect(screen.queryByText("Bat Erdene")).not.toBeInTheDocument();

    // No item rows, no category subtotals, no payment history
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.queryByText("Oil change")).not.toBeInTheDocument();
    expect(screen.queryByText(/02 Aug 2026/)).not.toBeInTheDocument();

    // No discount/VAT rows; no amount-paid/balance rows when nothing paid
    expect(screen.queryByText("-₮10,000")).not.toBeInTheDocument();
    expect(screen.queryByText("₮24,000")).not.toBeInTheDocument();
    expect(screen.queryByText("₮50,000")).not.toBeInTheDocument();
    expect(screen.queryByText("₮84,000")).not.toBeInTheDocument();

    // Grand total still renders; no due date or notes/terms
    expect(screen.getByText("₮134,000")).toBeInTheDocument();
    expect(screen.queryByText(/15 Aug 2026/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Thank you for your visit"),
    ).not.toBeInTheDocument();
  });
});
