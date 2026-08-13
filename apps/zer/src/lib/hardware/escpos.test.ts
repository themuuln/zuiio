import { describe, expect, it } from "vitest";
import {
  buildSaleReceipt,
  EscPosBuilder,
  openCashDrawerCommand,
  textBytes,
} from "./escpos";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

describe("EscPosBuilder", () => {
  it("initializes the printer (ESC @)", () => {
    expect(hex(new EscPosBuilder().init().toUint8Array())).toBe("1b 40");
  });

  it("sets alignment (ESC a n)", () => {
    const b = new EscPosBuilder();
    b.align("left");
    b.align("center");
    b.align("right");
    expect(hex(b.toUint8Array())).toBe("1b 61 00 1b 61 01 1b 61 02");
  });

  it("sets print mode bitmask (ESC ! n)", () => {
    const b = new EscPosBuilder();
    b.mode({ bold: true });
    b.mode({ doubleWidth: true, doubleHeight: true });
    expect(hex(b.toUint8Array())).toBe("1b 21 08 1b 21 30");
  });

  it("feeds lines (ESC d n)", () => {
    expect(hex(new EscPosBuilder().feed(3).toUint8Array())).toBe("1b 64 03");
  });

  it("cuts paper (GS V 66 n)", () => {
    expect(hex(new EscPosBuilder().cut().toUint8Array())).toBe("1d 56 42 00");
  });

  it("builds the cash drawer kick pulse (ESC p m t1 t2)", () => {
    // Default Epson values: 50ms on, 500ms off → t1=25, t2=250.
    expect(hex(openCashDrawerCommand())).toBe("1b 70 00 19 fa");
    // Pin 1 with custom timings: 100ms on, 400ms off.
    expect(
      hex(new EscPosBuilder().drawerPulse(1, 100, 400).toUint8Array()),
    ).toBe("1b 70 01 32 c8");
  });

  it("emits Code 128 barcode (GS k 69 n ... NUL)", () => {
    const bytes = new EscPosBuilder().barcode("ABC123").toUint8Array();
    expect(Array.from(bytes.slice(0, 3))).toEqual([0x1d, 0x6b, 0x49]);
    expect(bytes[3]).toBe(6); // payload length
    expect(Array.from(bytes.slice(4, 10))).toEqual([...textBytes("ABC123")]);
    expect(bytes[bytes.length - 1]).toBe(0x00); // terminator
  });

  it("encodes Mongolian Cyrillic as UTF-8 (Ө, Ү live outside CP866)", () => {
    // U+04E8 Ө → D3 A8 · U+04E9 ө → D3 A9 · U+04AE Ү → D2 AE
    expect(hex(Uint8Array.from(textBytes("ӨөҮ")))).toBe("d3 a8 d3 a9 d2 ae");
  });

  it("writes text lines terminated by LF", () => {
    const bytes = new EscPosBuilder().line("Хэвлэх").toUint8Array();
    expect(bytes[bytes.length - 1]).toBe(0x0a);
    expect(Array.from(bytes.slice(0, -1))).toEqual(textBytes("Хэвлэх"));
  });

  it("centers text and restores left alignment", () => {
    const bytes = new EscPosBuilder().center("Дэлгүүр").toUint8Array();
    // ESC a 01 (center) … LF … ESC a 00 (left)
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x61);
    expect(bytes[2]).toBe(0x01);
    const tail = Array.from(bytes.slice(-3));
    expect(tail).toEqual([0x1b, 0x61, 0x00]);
  });
});

describe("buildSaleReceipt", () => {
  const base = {
    orgName: "Тест Дэлгүүр",
    saleId: "11111111-2222-4333-8444-555555555555",
    createdAt: "2026-08-13T10:00:00Z",
    lines: [
      {
        name: "Сүү",
        variantLabel: null,
        quantity: 2,
        unitPrice: 5000,
        totalPrice: 10000,
      },
    ],
    subtotal: 10000,
    discountAmount: 0,
    pointsDiscount: null,
    giftCardAmount: null,
    deliveryFee: null,
    total: 10000,
    paidAmount: 10000,
    change: 0,
    paymentMethod: "cash",
    pointsEarned: 10,
  };

  it("starts with printer init and ends with a cut", () => {
    const bytes = buildSaleReceipt(base);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
    const tail = Array.from(bytes.slice(-4));
    expect(tail).toEqual([0x1d, 0x56, 0x42, 0x00]);
  });

  it("includes org name, item line, totals, and payment", () => {
    const bytes = buildSaleReceipt(base);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("Тест Дэлгүүр");
    expect(text).toContain("Сүү");
    expect(text).toContain("2 x 5,000₮");
    expect(text).toContain("10,000₮");
    expect(text).toContain("ТӨЛСӨН");
    expect(text).toContain("Бэлэн");
    expect(text).toContain("+10 оноо");
  });

  it("renders the points discount and gift card rows when present", () => {
    const bytes = buildSaleReceipt({
      ...base,
      subtotal: 20000,
      discountAmount: 1000, // includes the points portion
      pointsDiscount: 500,
      giftCardAmount: 5000,
      total: 14000,
    });
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("Онооны хямдрал");
    expect(text).toContain("-500₮");
    expect(text).toContain("Бэлгийн карт");
  });

  it("shows change when the customer overpays", () => {
    const bytes = buildSaleReceipt({
      ...base,
      paidAmount: 15000,
      change: 5000,
    });
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("Өгөр");
    expect(text).toContain("5,000₮");
  });

  it("omits the payment row for invoice sales", () => {
    const bytes = buildSaleReceipt({ ...base, paymentMethod: "invoice" });
    const text = new TextDecoder().decode(bytes);
    expect(text).not.toContain("Нэхэмжлэл");
  });
});
