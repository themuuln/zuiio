import { QPayClient } from "qpay-js";

export type PremiumPlan = "monthly" | "annual" | "lifetime";

const planPrices: Record<PremiumPlan, number> = {
  monthly: 9900,
  annual: 79000,
  lifetime: 199000,
};

const planLabels: Record<PremiumPlan, string> = {
  monthly: "Сарын Дээд",
  annual: "Жилийн Дээд",
  lifetime: "Насан туршийн",
};

function getClient() {
  return new QPayClient({
    baseUrl: process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn",
    username: process.env.QPAY_CLIENT_ID || "",
    password: process.env.QPAY_CLIENT_SECRET || "",
    invoiceCode: process.env.QPAY_INVOICE_CODE || "",
    callbackUrl: process.env.QPAY_CALLBACK_URL || "",
  });
}

export async function createPaymentInvoice(
  plan: PremiumPlan,
  userId: string,
  coupleId: string,
) {
  const client = getClient();
  const amount = planPrices[plan];
  const label = planLabels[plan];

  const invoice = await client.createSimpleInvoice({
    invoiceCode: process.env.QPAY_INVOICE_CODE || "GERBUL_PREMIUM",
    senderInvoiceNo: `GERBUL-${userId}-${Date.now()}`,
    invoiceReceiverCode: userId,
    invoiceDescription: `Gerbul ${label} — ₮${amount.toLocaleString()}`,
    amount,
    callbackUrl: `${process.env.QPAY_CALLBACK_URL}?user_id=${userId}&couple_id=${coupleId}&plan=${plan}`,
  });

  return {
    invoiceId: invoice.invoiceId,
    qrImage: invoice.qrImage,
    qPayShortUrl: invoice.qPayShortUrl,
    amount,
    plan,
    label,
  };
}

export async function checkPaymentStatus(invoiceId: string) {
  const client = getClient();
  const result = await client.checkPayment({
    objectType: "INVOICE",
    objectId: invoiceId,
    offset: { pageNumber: 1, pageLimit: 10 },
  });

  return {
    paid: result.count > 0,
    count: result.count,
    paidAmount: result.paidAmount,
    payments: result.rows,
  };
}

export { planPrices, planLabels };
