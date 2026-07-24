import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createInvoice, getQPayConfig } from "@/lib/shop/qpay";

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  variantIndex: z.number().int().min(0),
  customerName: z.string().trim().min(1, "Нэрээ оруулна уу"),
  phone: z
    .string()
    .trim()
    .min(1, "Утасны дугаараа оруулна уу")
    .regex(/^\d{8}$/, "Утасны дугаар 8 оронтой байх ёстой"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Буруу өгөгдөл" },
        { status: 400 },
      );
    }

    const { productId, variantIndex, customerName, phone } = parsed.data;

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("cmd_create_shop_order", {
      p_product_id: productId,
      p_variant_index: variantIndex,
      p_customer_name: customerName,
      p_phone: phone,
    });

    if (error) {
      if (error.message.includes("ONOO_SHOP_OUT_OF_STOCK")) {
        return NextResponse.json(
          { error: "Бараа дууссан байна" },
          { status: 400 },
        );
      }
      if (error.message.includes("ONOO_SHOP_PRODUCT_NOT_FOUND")) {
        return NextResponse.json(
          { error: "Бүтээгдэхүүн олдсонгүй" },
          { status: 400 },
        );
      }
      throw error;
    }

    const orderId = data as string;

    // Create QPay invoice via shared adapter (auto mock if env not set)
    const config = getQPayConfig();
    const invoice = await createInvoice(config, {
      amount: 300,
      merchantInvoiceId: `shop-${orderId}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:3000"}/api/qpay/callback`,
    });

    // Attach invoice to order
    const attachResult = await supabase.rpc("cmd_attach_shop_invoice", {
      p_order_id: orderId,
      p_qpay_invoice_id: invoice.invoiceId,
      p_qpay_qr_image: invoice.qrImage,
    });

    if (attachResult.error) {
      // Cancel the order — release stock
      try {
        await supabase.rpc("cmd_cancel_shop_order", {
          p_order_id: orderId,
        });
      } catch {
        // Best-effort cancellation
      }
      return NextResponse.json(
        { error: "QPay системд алдаа гарлаа. Дахиж оролдоно уу." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      orderId,
      totalMnt: invoice.amount ?? 300,
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      merchantInvoiceId: invoice.invoiceId,
      expiresIn: invoice.expiresIn,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Серверийн алдаа. Дахиж оролдоно уу." },
      { status: 500 },
    );
  }
}
