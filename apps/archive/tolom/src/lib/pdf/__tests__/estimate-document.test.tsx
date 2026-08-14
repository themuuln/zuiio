import { screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { EstimateDocument } from "../estimate-document";

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
  phone: "+97670001111",
  email: "info@ubauto.mn",
  address: "Sukhbaatar District",
};

function makeEstimate(overrides: Record<string, unknown> = {}) {
  return {
    estimate_number: "EST-2026-001",
    status: "approved",
    created_at: "2026-08-01T12:00:00Z",
    valid_until: "2026-10-01T12:00:00Z",
    notes: "Please confirm the quote",
    terms: "Payment due on completion",
    subtotal: 120000,
    discount_amount: 10000,
    discount_percentage: 0,
    discount_total: 10000,
    tax_total: 24000,
    grand_total: 134000,
    customer: {
      first_name: "Bat",
      last_name: "Erdene",
      phone: "+97699112233",
      email: "bat@example.com",
    },
    vehicle: {
      plate_number: "1234УБА",
      make: "Toyota",
      model: "Prius",
      year: 2019,
    },
    items: [
      {
        description: "Oil change",
        item_type: "service",
        quantity: 1,
        unit_price: 52000,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 50000,
      },
      {
        description: "Oil filter",
        item_type: "part",
        quantity: 2,
        unit_price: 15000,
        discount_amount: 5000,
        discount_percentage: 0,
        line_total: 25000,
      },
      {
        description: "Custom work",
        item_type: "custom",
        quantity: 1,
        unit_price: 32000,
        discount_amount: 0,
        discount_percentage: 10,
        line_total: 30000,
      },
    ],
    ...overrides,
  };
}

/** data-style attribute of the Text node holding `content` */
function textStyleOf(content: string): string {
  return screen.getByText(content).getAttribute("data-style") ?? "";
}

describe("EstimateDocument", () => {
  it("renders org header, customer, vehicle and item rows with exact totals", () => {
    render(
      <EstimateDocument estimate={makeEstimate()} org={ORG} locale="mn" />,
    );

    // Header: org details + estimate meta
    expect(screen.getByText("UB Auto Service")).toBeInTheDocument();
    expect(screen.getByText("Sukhbaatar District")).toBeInTheDocument();
    expect(screen.getByText("Tel: +97670001111")).toBeInTheDocument();
    expect(screen.getByText("info@ubauto.mn")).toBeInTheDocument();
    expect(screen.getByText("EST-2026-001")).toBeInTheDocument();
    expect(screen.getByText(/01 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText(/01 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();

    // Bill-to + vehicle
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    expect(screen.getByText("+97699112233")).toBeInTheDocument();
    expect(screen.getByText("bat@example.com")).toBeInTheDocument();
    expect(screen.getByText("1234УБА")).toBeInTheDocument();
    expect(screen.getByText("2019 Toyota Prius")).toBeInTheDocument();

    // Item rows: type labels, quantities, unit prices, discounts, line totals
    expect(screen.getByText("ҮЙЛ")).toBeInTheDocument();
    expect(screen.getByText("ЭД")).toBeInTheDocument();
    expect(screen.getByText("ӨӨР")).toBeInTheDocument();
    expect(screen.getByText("Oil change")).toBeInTheDocument();
    expect(screen.getByText("Oil filter")).toBeInTheDocument();
    expect(screen.getByText("Custom work")).toBeInTheDocument();
    expect(screen.getByText("₮52,000")).toBeInTheDocument();
    expect(screen.getByText("-₮5,000")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("₮25,000")).toBeInTheDocument();
    expect(screen.getByText("₮32,000")).toBeInTheDocument();

    // Totals: exact ₮ sums with discount and VAT rows
    expect(screen.getByText("₮120,000")).toBeInTheDocument();
    expect(screen.getByText("-₮10,000")).toBeInTheDocument();
    expect(screen.getByText("₮24,000")).toBeInTheDocument();
    expect(screen.getByText("₮134,000")).toBeInTheDocument();

    // Notes, terms, footer
    expect(screen.getByText("Please confirm the quote")).toBeInTheDocument();
    expect(screen.getByText("Payment due on completion")).toBeInTheDocument();
    expect(
      screen.getByText("Хамтран ажилласанд баярлалаа — UB Auto Service"),
    ).toBeInTheDocument();
  });

  it("uses English labels and type abbreviations for locale en", () => {
    render(
      <EstimateDocument estimate={makeEstimate()} org={ORG} locale="en" />,
    );

    expect(screen.getByText("Bill To")).toBeInTheDocument();
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
    expect(screen.getByText("SVC")).toBeInTheDocument();
    expect(screen.getByText("PRT")).toBeInTheDocument();
    expect(screen.getByText("CUS")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    // "Total" is both the column header and the grand-total label in en
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(2);
  });

  it("colors the status badge and the discount row with the status palette", () => {
    render(
      <EstimateDocument estimate={makeEstimate()} org={ORG} locale="en" />,
    );

    // approved → colors.success (#16a34a)
    expect(textStyleOf("approved")).toContain("#16a34a");
    // discount total row → colors.destructive (#dc2626)
    expect(textStyleOf("-₮10,000")).toContain("#dc2626");
  });

  it("handles a missing customer, vehicle, items and optional totals", () => {
    render(
      <EstimateDocument
        estimate={makeEstimate({
          customer: null,
          vehicle: null,
          items: [],
          valid_until: null,
          notes: null,
          terms: null,
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          grand_total: 0,
        })}
        org={{ name: "UB Auto Service" }}
      />,
    );

    // Bill-to shows an em dash placeholder instead of a customer
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("Bat Erdene")).not.toBeInTheDocument();
    expect(screen.queryByText("2019 Toyota Prius")).not.toBeInTheDocument();

    // Empty items row
    expect(screen.getByText("noItems")).toBeInTheDocument();
    expect(screen.queryByText("Oil change")).not.toBeInTheDocument();

    // Zero totals: no discount/VAT rows, but subtotal and grand total render
    expect(screen.queryByText("-₮10,000")).not.toBeInTheDocument();
    expect(screen.queryByText("₮24,000")).not.toBeInTheDocument();
    expect(screen.getAllByText("₮0").length).toBeGreaterThanOrEqual(2);

    // No valid-until, notes or terms sections
    expect(screen.queryByText(/01 Oct 2026/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Please confirm the quote"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Payment due on completion"),
    ).not.toBeInTheDocument();

    // Footer still renders
    expect(
      screen.getByText("Хамтран ажилласанд баярлалаа — UB Auto Service"),
    ).toBeInTheDocument();
  });
});
