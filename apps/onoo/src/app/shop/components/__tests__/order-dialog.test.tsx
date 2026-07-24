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
  it("renders without crashing", () => {
    const { container } = render(<OrderDialog slug="mayk" priceMnt={50000} />);
    // Renders a native dialog element
    expect(container.querySelector("dialog")).toBeInTheDocument();
  });
});
