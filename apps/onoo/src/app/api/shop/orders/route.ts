import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

    // Create QPay invoice
    const qpayRes = await createQPayInvoice(orderId, 300);

    if (!qpayRes.ok) {
      // Cancel the order — release stock
      try {
        await supabase.rpc("cmd_cancel_shop_order", {
          p_order_id: orderId,
        });
      } catch {
        // Best-effort cancellation — order will be cleaned up by cron
      }

      return NextResponse.json(
        { error: "QPay системд алдаа гарлаа. Дахиж оролдоно уу." },
        { status: 502 },
      );
    }

    const qpayData = await qpayRes.json();
    const invoiceId = qpayData.invoice_id ?? qpayData.invoiceId;

    // Attach invoice to order
    await supabase.rpc("cmd_attach_shop_invoice", {
      p_order_id: orderId,
      p_invoice_id: invoiceId,
      p_qr_image: qpayData.qr_image ?? qpayData.qrImage ?? "",
    });

    return NextResponse.json({
      orderId,
      totalMnt: qpayData.amount ?? 0,
      qrImage: qpayData.qr_image ?? qpayData.qrImage ?? "",
      qrText: qpayData.qr_text ?? qpayData.qrText ?? "",
      merchantInvoiceId: invoiceId,
      expiresIn: qpayData.expires_in ?? qpayData.expiresIn ?? 300,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Серверийн алдаа. Дахиж оролдоно уу." },
      { status: 500 },
    );
  }
}

async function createQPayInvoice(
  orderId: string,
  amount: number,
): Promise<Response> {
  // In production, this would call QPay API via qpay.ts
  // For now, return mock response for development
  return new Response(
    JSON.stringify({
      invoice_id: `INV-${orderId.slice(0, 8)}`,
      qr_text: `qpay://${orderId}`,
      qr_image: "",
      amount,
      expires_in: 300,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
