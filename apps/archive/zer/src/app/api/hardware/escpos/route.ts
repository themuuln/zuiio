import { capture, withDbCapture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/erp";
import {
  buildSaleReceipt,
  type EscPosReceiptData,
  openCashDrawerCommand,
} from "@/lib/hardware/escpos";
import { sendEscPosCommand } from "@/lib/hardware/network";

type HardwareBody =
  | { command: "print"; sale_id: string }
  | { command: "drawer" };

/**
 * POST /api/hardware/escpos
 *
 * Staff-only bridge between the browser POS and a network ESC/POS printer.
 * The register calls this after a completed sale:
 *
 *   { command: "print", sale_id }  — thermal receipt via the ESC/POS driver
 *   { command: "drawer" }          — cash-drawer kick pulse
 *
 * The printer address comes from the org's organizations.escpos_host /
 * escpos_port (set in settings). When unconfigured this returns 400 and
 * the POS falls back to the browser print dialog. Failures are captured
 * and surfaced as 502 — they never block the sale itself.
 */
export async function POST(request: Request) {
  let body: HardwareBody | null = null;
  try {
    const parsed = (await request.json()) as Partial<HardwareBody>;
    if (parsed.command === "print") {
      if (typeof parsed.sale_id !== "string" || !parsed.sale_id) {
        return NextResponse.json(
          { ok: false, error: "sale_id required for print" },
          { status: 400 },
        );
      }
      body = { command: "print", sale_id: parsed.sale_id };
    } else if (parsed.command === "drawer") {
      body = { command: "drawer" };
    }
  } catch {
    // fall through — body stays null → 400 below
  }

  if (!body) {
    return NextResponse.json(
      { ok: false, error: 'command must be "print" or "drawer"' },
      { status: 400 },
    );
  }

  const { supabase, organizationId } = await requireAppContext();

  const { data: org, error: orgError } = await withDbCapture(
    "hardware:org",
    supabase
      .from("organizations" as never)
      .select("escpos_host, escpos_port, name")
      .eq("id" as never, organizationId)
      .single(),
  );
  if (orgError) {
    capture(orgError, { context: "hardware: org settings" });
    return NextResponse.json(
      { ok: false, error: "Тохиргоо уншихад алдаа гарлаа" },
      { status: 500 },
    );
  }

  const row = org as unknown as {
    escpos_host: string | null;
    escpos_port: number | null;
    name: string | null;
  } | null;
  const host = row?.escpos_host ?? null;
  const port = Number(row?.escpos_port ?? 9100);

  if (!host) {
    return NextResponse.json(
      { ok: false, error: "ESC/POS printer not configured" },
      { status: 400 },
    );
  }

  let bytes: Uint8Array;
  if (body.command === "drawer") {
    bytes = openCashDrawerCommand();
  } else {
    const receipt = await loadReceiptData(
      supabase,
      organizationId,
      body.sale_id,
      row?.name ?? "Дэлгүүр",
    );
    if (!receipt) {
      return NextResponse.json(
        { ok: false, error: "Захиалга олдсонгүй" },
        { status: 404 },
      );
    }
    bytes = buildSaleReceipt(receipt);
  }

  try {
    await sendEscPosCommand({ host, port }, bytes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    capture(err, {
      context: "hardware: escpos send",
      extra: { host, port, command: body.command },
    });
    return NextResponse.json(
      { ok: false, error: "Принтерт хүрэх боломжгүй байна" },
      { status: 502 },
    );
  }
}

type SaleRow = {
  id: string;
  total_amount: number;
  original_amount: number | null;
  discount_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  sale_date: string;
  invoice: { invoice_number: string | null } | null;
  branches: { name: string | null } | null;
  profiles: { full_name: string | null } | null;
};

type SaleItemRow = {
  quantity: number;
  unit_price: number;
  total_price: number;
  products: { name: string | null } | null;
  product_variants: { option_labels: string[] | null } | null;
};

async function loadReceiptData(
  supabase: Awaited<ReturnType<typeof requireAppContext>>["supabase"],
  organizationId: string,
  saleId: string,
  orgName: string,
): Promise<EscPosReceiptData | null> {
  const [saleResult, itemsResult] = await Promise.all([
    withDbCapture(
      "hardware:sale",
      supabase
        .from("sales")
        .select(
          "id, total_amount, original_amount, discount_amount, paid_amount, payment_method, sale_date, invoice:invoices(invoice_number), branches(name), profiles!sales_salesperson_id_fkey(full_name)",
        )
        .eq("id", saleId)
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ),
    withDbCapture(
      "hardware:sale_items",
      supabase
        .from("sale_items")
        .select(
          "quantity, unit_price, total_price, products(name), product_variants(option_labels)",
        )
        .eq("sale_id", saleId)
        .order("id", { ascending: true }),
    ),
  ]);

  const sale = saleResult.data as SaleRow | null;
  if (saleResult.error || !sale) {
    if (saleResult.error) {
      capture(saleResult.error, { context: "hardware: load sale" });
    }
    return null;
  }

  const items = (itemsResult.data ?? []) as SaleItemRow[];
  const subtotal = Number(sale.original_amount ?? sale.total_amount ?? 0);
  const total = Number(sale.total_amount ?? subtotal);
  const paid = Number(sale.paid_amount ?? total);

  return {
    orgName,
    registerName: sale.branches?.name ?? null,
    cashierName: sale.profiles?.full_name ?? null,
    saleId: sale.id,
    invoiceNumber: sale.invoice?.invoice_number ?? null,
    createdAt: sale.sale_date,
    lines: items.map((item) => ({
      name: item.products?.name ?? "Бараа",
      variantLabel: item.product_variants?.option_labels?.join(", ") ?? null,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    })),
    subtotal,
    discountAmount: Number(sale.discount_amount ?? 0),
    pointsDiscount: null,
    giftCardAmount: null,
    deliveryFee: null,
    total,
    paidAmount: paid,
    change: paid > total ? paid - total : null,
    paymentMethod: sale.payment_method ?? "cash",
    pointsEarned: null,
  };
}
