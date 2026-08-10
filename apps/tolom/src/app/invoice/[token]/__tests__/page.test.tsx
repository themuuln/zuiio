import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvoiceWithItems } from "@/lib/types";
import { render } from "@/test/test-utils";
import PublicInvoicePage from "../page";

const mocks = vi.hoisted(() => ({
  reportServerError: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return { ...actual, useTranslations: () => (key: string) => key };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ token: "tok-1" }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => <div data-testid="export-button" />,
}));

vi.mock("@/components/locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

const invoice = {
  id: "inv-1",
  invoice_number: "INV-2026-001",
  status: "paid",
  issued_at: "2026-08-01T00:00:00Z",
  due_at: null,
  customer_name: "Дорж",
  customer_address: "UB",
  vehicle_plate: "1234УБА",
  vehicle_details: "Toyota Prius 2020",
  organization_name: "Test Garage",
  subtotal: "100000",
  discount_total: "10000",
  total: "90000",
  amount_paid: "90000",
  balance_due: "0",
  notes: "thank you note",
  terms: null,
  footer: "footer note",
  items: [
    {
      id: "i1",
      item_type: "service",
      description: "Oil change",
      quantity: 1,
      unit_price: "50000",
      discount_amount: "0",
      total_price: "50000",
    },
    {
      id: "i2",
      item_type: "part",
      description: "Oil filter",
      quantity: 2,
      unit_price: "25000",
      discount_amount: "0",
      total_price: "50000",
    },
  ],
  payments: [
    {
      id: "p1",
      paid_at: "2026-08-01T00:00:00Z",
      method: "card",
      reference: "ref-1",
      amount: "90000",
    },
  ],
} as unknown as InvoiceWithItems;

function stubFetch(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

describe("PublicInvoicePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a skeleton while loading", () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<PublicInvoicePage />);

    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
    resolveFetch({ json: async () => ({ data: invoice }) });
  });

  it("renders the invoice with items, payments and totals", async () => {
    vi.stubGlobal("fetch", stubFetch({ data: invoice }));

    render(<PublicInvoicePage />);

    await waitFor(() => expect(screen.getByText("Test Garage")).toBeTruthy());
    // t-mock returns keys, so the number substitution renders as the key
    expect(screen.getByText("invoiceNumber")).toBeTruthy();
    expect(screen.getByText("Oil change")).toBeTruthy();
    expect(screen.getByText("Oil filter")).toBeTruthy();
    expect(screen.getByText("Дорж")).toBeTruthy();
    expect(screen.getByText("1234УБА")).toBeTruthy();
    expect(screen.getByText("ref-1")).toBeTruthy();
    expect(screen.getByText("thank you note")).toBeTruthy();
    // Subtotal, discount line and grand total (mn-MN currency format)
    expect(screen.getByText(/₮ 100,000/)).toBeTruthy();
    // Grand total and amount-paid both render 90,000
    expect(screen.getAllByText(/₮ 90,000/).length).toBeGreaterThan(0);
  });

  it("renders the error state when the API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      stubFetch({ error: { message: "Invoice not found" } }),
    );

    render(<PublicInvoicePage />);

    await waitFor(() =>
      expect(screen.getByText("Invoice not found")).toBeTruthy(),
    );
  });

  it("renders the error state on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<PublicInvoicePage />);

    await waitFor(() => expect(screen.getByText("loadError")).toBeTruthy());
    expect(mocks.reportServerError).toHaveBeenCalled();
  });

  it("shows the no-line-items row for an empty invoice", async () => {
    vi.stubGlobal(
      "fetch",
      stubFetch({ data: { ...invoice, items: [], payments: [] } }),
    );

    render(<PublicInvoicePage />);

    await waitFor(() => expect(screen.getByText("noLineItems")).toBeTruthy());
  });

  it("prints when the print button is clicked", async () => {
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);
    vi.stubGlobal("fetch", stubFetch({ data: invoice }));

    render(<PublicInvoicePage />);

    await waitFor(() => expect(screen.getByText("print")).toBeTruthy());
    fireEvent.click(screen.getByText("print"));
    expect(printMock).toHaveBeenCalledTimes(1);
  });
});
