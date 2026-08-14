import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { InvoiceQrPopover } from "../_invoice-qr-popover";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,FAKEQR"),
  },
}));

describe("InvoiceQrPopover", () => {
  it("shows the QR popover on hover", async () => {
    render(
      <InvoiceQrPopover url="https://invoice.example/1">
        <span>qr-trigger</span>
      </InvoiceQrPopover>,
    );
    fireEvent.mouseEnter(screen.getByText("qr-trigger"));
    await waitFor(() =>
      expect(screen.getByAltText("invoiceQrCode")).toBeTruthy(),
    );
    expect(screen.getByText("scanToViewInvoice")).toBeTruthy();
    expect(screen.getByAltText("invoiceQrCode").getAttribute("src")).toBe(
      "data:image/png;base64,FAKEQR",
    );
  });

  it("closes the popover on mouse leave", async () => {
    render(
      <InvoiceQrPopover url="https://invoice.example/1">
        <span>qr-trigger</span>
      </InvoiceQrPopover>,
    );
    fireEvent.mouseEnter(screen.getByText("qr-trigger"));
    await waitFor(() =>
      expect(screen.getByAltText("invoiceQrCode")).toBeTruthy(),
    );
    fireEvent.mouseLeave(screen.getByText("qr-trigger"));
    await waitFor(() =>
      expect(screen.queryByAltText("invoiceQrCode")).toBeNull(),
    );
  });

  it("opens the invoice URL on click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <InvoiceQrPopover url="https://invoice.example/1">
        <span>qr-trigger</span>
      </InvoiceQrPopover>,
    );
    fireEvent.click(screen.getByText("qr-trigger"));
    expect(openSpy).toHaveBeenCalledWith("https://invoice.example/1", "_blank");
    openSpy.mockRestore();
  });

  it("does not render the popover without a URL", () => {
    render(
      <InvoiceQrPopover url="">
        <span>qr-trigger</span>
      </InvoiceQrPopover>,
    );
    fireEvent.mouseEnter(screen.getByText("qr-trigger"));
    expect(screen.queryByAltText("invoiceQrCode")).toBeNull();
  });
});
