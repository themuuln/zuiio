import { type NextRequest, NextResponse } from "next/server";
import {
  checkPayment,
  createInvoice,
  getQPayConfig,
  QPayError,
} from "@/lib/shop/qpay";

export async function POST(req: NextRequest) {
  try {
    const { amount, description, merchantId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Дүн буруу байна" }, { status: 400 });
    }

    const config = getQPayConfig();
    const invoice = await createInvoice(config, {
      amount,
      merchantInvoiceId: `academy-${Date.now()}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/qpay-callback`,
    });

    return NextResponse.json(invoice);
  } catch (err) {
    if (err instanceof QPayError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Төлбөр үүсгэхэд алдаа гарлаа" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoice_id");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoice_id заавал байх ёстой" },
        { status: 400 },
      );
    }

    const config = getQPayConfig();
    const status = await checkPayment(config, invoiceId);

    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof QPayError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Төлөв шалгахад алдаа гарлаа" },
      { status: 500 },
    );
  }
}
