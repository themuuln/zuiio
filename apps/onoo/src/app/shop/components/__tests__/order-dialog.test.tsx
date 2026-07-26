import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderDialog } from "@/app/shop/components/order-dialog";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        orderId: "ord-1",
        totalMnt: 50000,
        qrImage: "data:image/png;base64,qr123",
        qrText: "QR_CONTENT",
        merchantInvoiceId: "inv-1",
        expiresIn: 300,
      }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OrderDialog", () => {
  it("renders without crashing when closed", () => {
    const { container } = render(
      <OrderDialog
        open={false}
        onOpenChange={vi.fn()}
        productId="p1"
        variantIndex={0}
        priceMnt={50000}
        productName="Test Product"
        variantSize="M"
      />,
    );
    // When closed, shadcn Dialog renders nothing visible
    expect(container.textContent).toBe("");
  });

  it("renders product info and form when open", () => {
    render(
      <OrderDialog
        open={true}
        onOpenChange={vi.fn()}
        productId="p1"
        variantIndex={0}
        priceMnt={50000}
        productName="Test Product"
        variantSize="M"
      />,
    );
    // Shows product name and size in the order recap
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/Хэмжээ: M/)).toBeInTheDocument();
    // Shows the form inputs
    expect(screen.getByText("Захиалга баталгаажуулах")).toBeInTheDocument();
  });
});
