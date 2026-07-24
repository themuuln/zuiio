import "server-only";
import nodemailer from "nodemailer";
import { qrPngBuffer } from "@/lib/qr";
import type { EsimRow, OrderRow } from "@/lib/supabase/types";
import { orderAccessToken } from "@/lib/token";

/**
 * Env-driven SMTP delivery (adapted from apps/zer/src/lib/email.ts,
 * single-tenant). Skips silently when SMTP is not configured —
 * the delivery page always remains the source of truth.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function localePrefix(order: OrderRow): string {
  return order.locale === "mn" ? "" : `/${order.locale}`;
}

function deliveryUrl(order: OrderRow): string {
  return `${appUrl()}${localePrefix(order)}/orders/${order.order_code}?t=${orderAccessToken(order.order_code)}`;
}

function paymentUrl(order: OrderRow): string {
  return `${appUrl()}${localePrefix(order)}/orders/${order.order_code}/pay`;
}

function lookupUrl(): string {
  return `${appUrl()}/lookup`;
}

function formatMnt(amount: number): string {
  return `${amount.toLocaleString("mn-MN")}₮`;
}

const COPY = {
  mn: {
    // ── delivery ──
    deliverySubject: (code: string) => `Таны eSIM бэлэн боллоо — ${code}`,
    ready: "Таны eSIM бэлэн боллоо!",
    scan: "Доорх QR кодыг утасныхаа камераар уншуулж eSIM-ээ суулгаарай:",
    manual: "Гар аргаар суулгах код (LPA):",
    view: "Захиалгаа онлайнаар үзэх",
    ios: "iPhone: Тохиргоо → Үүрэн холбоо → eSIM нэмэх",
    android: "Android: Тохиргоо → Сүлжээ ба интернет → SIM → eSIM нэмэх",
    // ── activation guide ──
    activateHeading: "eSIM-ээ хэрхэн идэвхижүүлэх вэ",
    activateIosTitle: "iOS (iPhone)",
    activateIosStep1: "1. Тохиргоо руу орно уу",
    activateIosStep2: "2. Үүрэн холбоо → eSIM нэмэх дарна уу",
    activateIosStep3: "3. QR кодыг камераар уншуулна уу",
    activateIosStep4: "4. eSIM-ийг үндсэн байдлаар сонгоно уу",
    activateAndroidTitle: "Android",
    activateAndroidStep1: "1. Тохиргоо руу орно уу",
    activateAndroidStep2: "2. Сүлжээ ба интернет → SIM → eSIM нэмэх",
    activateAndroidStep3: "3. QR кодыг камераар уншуулна уу",
    activateAndroidStep4: "4. eSIM-ийг үндсэн байдлаар сонгоно уу",
    keepQR: "⚠️ QR кодоо хадгалаарай — дахин суулгахад хэрэг болно!",
    needHelp: "Тусламж хэрэгтэй юу?",
    // ── confirmation ──
    confirmSubject: (code: string) => `Захиалга баталгаажуулалт — ${code}`,
    confirmHeading: "Захиалга баталгаажлаа!",
    confirmPackage: "Багц:",
    confirmTotal: "Нийт дүн:",
    confirmDeadline: "Төлбөрийн хугацаа:",
    confirmPay: "Одоо төлөх",
    // ── receipt ──
    receiptSubject: (code: string) => `Төлбөрийн баримт — ${code}`,
    receiptHeading: "Төлбөр амжилттай!",
    receiptPaid: "Төлсөн дүн:",
    receiptProcessing:
      "Таны eSIM-ийг боловсруулж байна. Имэйлээр хүлээн авна уу.",
    receiptView: "Захиалгаа үзэх",
    // ── expiry reminder ──
    expirySubject: (code: string) =>
      `eSIM-ийн хугацаа дуусах гэж байна — ${code}`,
    expiryHeading: "Таны eSIM-ийн хугацаа дуусах гэж байна!",
    expiryDaysLeft: (days: number) =>
      days <= 0
        ? "Таны eSIM-ийн хугацаа өнөөдөр дуусна."
        : `${days} хоног үлдлээ.`,
    expiryCTA: "Шинэ багц авах эсвэл нөхөн цэнэглэх",
  },
  en: {
    // ── delivery ──
    deliverySubject: (code: string) => `Your eSIM is ready — ${code}`,
    ready: "Your eSIM is ready!",
    scan: "Scan the QR code below with your phone camera to install:",
    manual: "Manual install code (LPA):",
    view: "View your order online",
    ios: "iPhone: Settings → Cellular → Add eSIM",
    android: "Android: Settings → Network & internet → SIMs → Add eSIM",
    // ── activation guide ──
    activateHeading: "How to activate your eSIM",
    activateIosTitle: "iOS (iPhone)",
    activateIosStep1: "1. Open Settings",
    activateIosStep2: "2. Tap Cellular → Add eSIM",
    activateIosStep3: "3. Scan the QR code with your camera",
    activateIosStep4: "4. Set as Default Line when prompted",
    activateAndroidTitle: "Android",
    activateAndroidStep1: "1. Open Settings",
    activateAndroidStep2: "2. Tap Network & internet → SIMs → Add eSIM",
    activateAndroidStep3: "3. Scan the QR code with your camera",
    activateAndroidStep4: "4. Set as Default SIM when prompted",
    keepQR: "⚠️ Keep your QR code safe — you may need it to reinstall!",
    needHelp: "Need help?",
    // ── confirmation ──
    confirmSubject: (code: string) => `Order Confirmation — ${code}`,
    confirmHeading: "Order Confirmed!",
    confirmPackage: "Package:",
    confirmTotal: "Total:",
    confirmDeadline: "Payment deadline:",
    confirmPay: "Pay Now",
    // ── receipt ──
    receiptSubject: (code: string) => `Payment Receipt — ${code}`,
    receiptHeading: "Payment Successful!",
    receiptPaid: "Amount paid:",
    receiptProcessing:
      "Your eSIM is being processed. You will receive it by email shortly.",
    receiptView: "View your order",
    // ── expiry reminder ──
    expirySubject: (code: string) => `Your eSIM is expiring soon — ${code}`,
    expiryHeading: "Your eSIM is expiring soon!",
    expiryDaysLeft: (days: number) =>
      days <= 0
        ? "Your eSIM expires today."
        : `${days} day${days === 1 ? "" : "s"} remaining.`,
    expiryCTA: "Top up or buy a new plan",
  },
} as const;
const EMAIL_FROM = () => process.env.EMAIL_FROM || "zim <noreply@zim.mn>";

// ---------------------------------------------------------------------------
// Delivery email (with activation guide)
// ---------------------------------------------------------------------------

export async function sendDeliveryEmail(
  order: OrderRow,
  esims: EsimRow[],
  packageName: string,
): Promise<void> {
  const transport = transporter();
  if (!transport) return;

  const copy = COPY[order.locale === "mn" ? "mn" : "en"];
  const delivered = esims.filter((e) => e.lpa_string);
  if (delivered.length === 0) return;

  const attachments = await Promise.all(
    delivered.map(async (esim, index) => ({
      filename: `esim-${index + 1}.png`,
      content: await qrPngBuffer(esim.lpa_string as string),
      cid: `esim-qr-${index}`,
    })),
  );

  const esimBlocks = delivered
    .map(
      (esim, index) => `
        <div style="margin:24px 0;padding:16px;border:1px solid #e5e5e5;border-radius:12px;text-align:center">
          <img src="cid:esim-qr-${index}" alt="eSIM QR" width="240" height="240" style="display:block;margin:0 auto"/>
          <p style="margin:12px 0 4px;color:#666;font-size:13px">${copy.manual}</p>
          <code style="font-size:12px;word-break:break-all">${escapeHtml(esim.lpa_string as string)}</code>
          ${esim.iccid ? `<p style="margin:8px 0 0;color:#999;font-size:12px">ICCID: ${escapeHtml(esim.iccid)}</p>` : ""}
        </div>`,
    )
    .join("");

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">${copy.ready}</h1>
      <p style="color:#444">${escapeHtml(packageName)} — <strong>${escapeHtml(order.order_code)}</strong></p>
      <p style="color:#444">${copy.scan}</p>
      ${esimBlocks}
      <p style="color:#666;font-size:13px">${copy.ios}<br/>${copy.android}</p>

      <!-- Activation Guide -->
      <div style="margin:32px 0 0;padding:16px;background:#f7f7f7;border-radius:12px">
        <h2 style="font-size:16px;margin:0 0 12px">${copy.activateHeading}</h2>
        <div style="margin-bottom:16px">
          <p style="font-weight:600;margin:0 0 4px">${copy.activateIosTitle}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateIosStep1}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateIosStep2}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateIosStep3}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateIosStep4}</p>
        </div>
        <div style="margin-bottom:16px">
          <p style="font-weight:600;margin:0 0 4px">${copy.activateAndroidTitle}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateAndroidStep1}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateAndroidStep2}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateAndroidStep3}</p>
          <p style="color:#444;font-size:13px;margin:2px 0">${copy.activateAndroidStep4}</p>
        </div>
        <p style="color:#b45309;font-size:13px;margin:0">${copy.keepQR}</p>
      </div>

      <p style="margin-top:24px;color:#888;font-size:13px">
        ${copy.needHelp} <a href="${lookupUrl()}" style="color:#0a7">${lookupUrl()}</a>
      </p>
      <p style="margin-top:8px">
        <a href="${deliveryUrl(order)}" style="color:#0a7">${copy.view} →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM(),
      to: order.email,
      subject: copy.deliverySubject(order.order_code),
      html,
      attachments,
    });
  } catch (error) {
    console.error("email: delivery send failed", error);
  }
}

// ---------------------------------------------------------------------------
// Order confirmation email (sent after order creation, before payment)
// ---------------------------------------------------------------------------

export async function sendConfirmationEmail(
  order: OrderRow,
  packageName: string,
  totalMnt: number,
): Promise<void> {
  const transport = transporter();
  if (!transport) return;

  const copy = COPY[order.locale === "mn" ? "mn" : "en"];
  const deadline = order.expires_at
    ? new Date(order.expires_at).toLocaleString(
        order.locale === "mn" ? "mn-MN" : "en-US",
      )
    : "—";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">${copy.confirmHeading}</h1>
      <p style="color:#444"><strong>${escapeHtml(order.order_code)}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px 0;color:#666">${copy.confirmPackage}</td>
          <td style="padding:8px 0;text-align:right;color:#444">${escapeHtml(packageName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666">${copy.confirmTotal}</td>
          <td style="padding:8px 0;text-align:right;color:#444;font-weight:600">${formatMnt(totalMnt)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666">${copy.confirmDeadline}</td>
          <td style="padding:8px 0;text-align:right;color:#444">${deadline}</td>
        </tr>
      </table>
      <p style="margin-top:24px;text-align:center">
        <a href="${paymentUrl(order)}" style="display:inline-block;padding:12px 32px;background:#0a7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${copy.confirmPay}</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM(),
      to: order.email,
      subject: copy.confirmSubject(order.order_code),
      html,
    });
  } catch (error) {
    console.error("email: confirmation send failed", error);
  }
}

// ---------------------------------------------------------------------------
// Payment receipt email (sent after payment succeeds)
// ---------------------------------------------------------------------------

export async function sendReceiptEmail(
  order: OrderRow,
  packageName: string,
  amountPaid: number,
): Promise<void> {
  const transport = transporter();
  if (!transport) return;

  const copy = COPY[order.locale === "mn" ? "mn" : "en"];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">${copy.receiptHeading}</h1>
      <p style="color:#444"><strong>${escapeHtml(order.order_code)}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px 0;color:#666">${copy.confirmPackage}</td>
          <td style="padding:8px 0;text-align:right;color:#444">${escapeHtml(packageName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666">${copy.receiptPaid}</td>
          <td style="padding:8px 0;text-align:right;color:#444;font-weight:600">${formatMnt(amountPaid)}</td>
        </tr>
      </table>
      <div style="margin:16px 0;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
        <p style="color:#166534;font-size:14px;margin:0">${copy.receiptProcessing}</p>
      </div>
      <p style="margin-top:24px;text-align:center">
        <a href="${deliveryUrl(order)}" style="color:#0a7">${copy.receiptView} →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM(),
      to: order.email,
      subject: copy.receiptSubject(order.order_code),
      html,
    });
  } catch (error) {
    console.error("email: receipt send failed", error);
  }
}

// ---------------------------------------------------------------------------
// Expiry reminder email (sent by cron ~24 h before eSIM expires)
// ---------------------------------------------------------------------------

export async function sendExpiryReminderEmail(
  order: OrderRow,
  _esim: EsimRow,
  packageName: string,
  daysRemaining: number,
): Promise<void> {
  const transport = transporter();
  if (!transport) return;

  const copy = COPY[order.locale === "mn" ? "mn" : "en"];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">${copy.expiryHeading}</h1>
      <p style="color:#444"><strong>${escapeHtml(order.order_code)}</strong> — ${escapeHtml(packageName)}</p>
      <div style="margin:16px 0;padding:12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px">
        <p style="color:#92400e;font-size:14px;margin:0;font-weight:600">${copy.expiryDaysLeft(daysRemaining)}</p>
      </div>
      <p style="margin-top:24px;text-align:center">
        <a href="${lookupUrl()}" style="display:inline-block;padding:12px 32px;background:#0a7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${copy.expiryCTA}</a>
      </p>
      <p style="margin-top:16px;text-align:center">
        <a href="${deliveryUrl(order)}" style="color:#0a7">${copy.view} →</a>
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: EMAIL_FROM(),
      to: order.email,
      subject: copy.expirySubject(order.order_code),
      html,
    });
  } catch (error) {
    console.error("email: expiry reminder send failed", error);
  }
}
