/**
 * ESC/POS thermal printer driver — byte-level command builder.
 *
 * Pure TypeScript, no runtime dependencies: every function returns the exact
 * byte sequence a printer interprets. Tested byte-for-byte in
 * `escpos.test.ts`.
 *
 * Encoding note: Mongolian Cyrillic (Ө U+04E8, Ү U+04AE) is NOT part of
 * CP437/CP866 — the DOS code pages most legacy ESC/POS printers use. Modern
 * thermal printers accept UTF-8 natively, so this driver emits UTF-8 text
 * bytes only. A printer that cannot print Ө/Ү correctly needs its own
 * UTF-8-capable mode; the byte stream is otherwise protocol-standard.
 */

const ESC = 0x1b;
const GS = 0x1d;

/** Cumulative byte builder — every method returns `this` for chaining. */
export class EscPosBuilder {
  private out: number[] = [];

  /** ESC @ — initialize printer (clears buffers, resets modes). */
  init(): this {
    this.out.push(ESC, 0x40);
    return this;
  }

  /** ESC a n — horizontal alignment (0 left, 1 center, 2 right). */
  align(align: "left" | "center" | "right"): this {
    const n = align === "left" ? 0 : align === "center" ? 1 : 2;
    this.out.push(ESC, 0x61, n);
    return this;
  }

  /** ESC ! n — print mode (bold | double-width | double-height | underline). */
  mode(
    mode: {
      bold?: boolean;
      doubleWidth?: boolean;
      doubleHeight?: boolean;
      underline?: boolean;
    } = {},
  ): this {
    let n = 0;
    if (mode.bold) n |= 0x08;
    if (mode.doubleHeight) n |= 0x10;
    if (mode.doubleWidth) n |= 0x20;
    if (mode.underline) n |= 0x80;
    this.out.push(ESC, 0x21, n);
    return this;
  }

  /** ESC d n — feed n blank lines. */
  feed(lines = 1): this {
    this.out.push(ESC, 0x64, lines & 0xff);
    return this;
  }

  /** GS V 66 n — partial cut (paper fed to cut position, one cut). */
  cut(): this {
    this.out.push(GS, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * ESC p m t1 t2 — cash drawer kick pulse.
   * pin 0 = drawer kick 2 (default), pin 1 = drawer kick 5.
   * t1/t2 in 2ms units: 25 = 50ms, 250 = 500ms (standard Epson values).
   */
  drawerPulse(pin: 0 | 1 = 0, onMs = 50, offMs = 500): this {
    this.out.push(
      ESC,
      0x70,
      pin,
      Math.round(onMs / 2) & 0xff,
      Math.round(offMs / 2) & 0xff,
    );
    return this;
  }

  /** GS k 69 n d1..dn NUL — Code 128 barcode. */
  barcode(code: string): this {
    const data = textBytes(code);
    this.out.push(GS, 0x6b, 0x49, data.length & 0xff, ...data, 0x00);
    return this;
  }

  /** Append literal bytes (e.g. a pre-encoded line). */
  raw(bytes: Uint8Array | number[]): this {
    this.out.push(...bytes);
    return this;
  }

  /** One text line + LF. */
  line(text: string): this {
    this.out.push(...textBytes(text), 0x0a);
    return this;
  }

  /** Centered helper — doubles as a header line. */
  center(
    text: string,
    opts: { bold?: boolean; doubleWidth?: boolean } = {},
  ): this {
    return this.align("center").mode(opts).line(text).mode().align("left");
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.out);
  }

  get length(): number {
    return this.out.length;
  }
}

/** UTF-8 encode text (Mongolian Cyrillic safe). */
export function textBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** The standalone cash-drawer kick sequence (printer port, pin 0). */
export function openCashDrawerCommand(pin: 0 | 1 = 0): Uint8Array {
  return new EscPosBuilder().drawerPulse(pin).toUint8Array();
}

export type EscPosReceiptLine = {
  name: string;
  variantLabel?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type EscPosReceiptData = {
  orgName: string;
  orgAddress?: string | null;
  registerName?: string | null;
  cashierName?: string | null;
  saleId: string;
  invoiceNumber?: string | null;
  createdAt: string;
  lines: EscPosReceiptLine[];
  subtotal: number;
  discountAmount?: number | null;
  pointsDiscount?: number | null;
  giftCardAmount?: number | null;
  deliveryFee?: number | null;
  total: number;
  paidAmount?: number | null;
  change?: number | null;
  paymentMethod: string;
  pointsEarned?: number | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
  qpay: "QPay",
  bnpl: "Хугацаатай",
  gift_card: "Бэлгийн карт",
};

function fmtMnt(value: number): string {
  return `${Math.round(value).toLocaleString("mn-MN")}₮`;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

/**
 * Build a full 58mm receipt (32 chars/line) as printer bytes.
 * Header centered, item lines with quantity/price columns, totals block,
 * payment info, optional loyalty line, then cut.
 */
export function buildSaleReceipt(data: EscPosReceiptData): Uint8Array {
  const b = new EscPosBuilder();
  b.init();
  b.feed(1);

  b.center(data.orgName, { bold: true });
  if (data.orgAddress) b.center(data.orgAddress);
  if (data.registerName) b.center(data.registerName);
  b.feed(1);

  const date = new Date(data.createdAt).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  b.line(`Дугаар: ${data.invoiceNumber ?? data.saleId.slice(0, 8)}`);
  b.line(`Огноо: ${date}`);
  if (data.cashierName) b.line(`Кассчин: ${data.cashierName}`);
  b.line("-".repeat(32));

  // Items: name (wrapped), then `qty x unit   total`.
  for (const line of data.lines) {
    b.line(line.name);
    if (line.variantLabel) b.line(`  ${line.variantLabel}`);
    const qtyText = `${line.quantity} x ${fmtMnt(line.unitPrice)}`;
    b.line(`${padRight(qtyText, 22)}${padRight(fmtMnt(line.totalPrice), 10)}`);
  }
  b.line("-".repeat(32));

  const row = (label: string, value: string, bold = false) => {
    if (bold) b.mode({ bold: true });
    b.line(padRight(label, 22) + padRight(value, 10));
    if (bold) b.mode();
  };

  row("Нийт дүн", fmtMnt(data.subtotal));
  const discount = (data.discountAmount ?? 0) - (data.pointsDiscount ?? 0);
  if (discount > 0) row("Хямдрал", `-${fmtMnt(discount)}`);
  if ((data.pointsDiscount ?? 0) > 0)
    row("Онооны хямдрал", `-${fmtMnt(data.pointsDiscount ?? 0)}`);
  if ((data.giftCardAmount ?? 0) > 0)
    row("Бэлгийн карт", `-${fmtMnt(data.giftCardAmount ?? 0)}`);
  if ((data.deliveryFee ?? 0) > 0)
    row("Хүргэлт", fmtMnt(data.deliveryFee ?? 0));
  b.line("-".repeat(32));
  row("ТӨЛСӨН", fmtMnt(data.total), true);
  if (data.paymentMethod !== "invoice") {
    row(
      PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod,
      fmtMnt(data.paidAmount ?? data.total),
    );
    if ((data.change ?? 0) > 0) row("Өгөр", fmtMnt(data.change ?? 0));
  }
  if ((data.pointsEarned ?? 0) > 0) {
    b.feed(1);
    b.line(`+${data.pointsEarned} оноо`);
  }
  b.feed(2);
  b.cut();
  return b.toUint8Array();
}
