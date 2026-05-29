/**
 * Shared styles, translations, and helpers for PDF documents (@react-pdf/renderer).
 */

import { StyleSheet } from "@react-pdf/renderer";

// ── Translations ─────────────────────────────────────────────

export type Locale = "en" | "mn";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    invoice: "INVOICE",
    workOrder: "WORK ORDER",
    billTo: "Bill To",
    vehicle: "Vehicle",
    customer: "Customer",
    details: "Details",
    items: "Items",
    services: "Services",
    parts: "Parts",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    discount: "Discount",
    total: "Total",
    subtotal: "Subtotal",
    grandTotal: "Total",
    amountPaid: "Amount Paid",
    balanceDue: "Balance Due",
    paymentHistory: "Payment History",
    date: "Date",
    method: "Method",
    reference: "Reference",
    notes: "Notes",
    terms: "Terms",
    mechanicNotes: "Mechanic Notes",
    complaint: "Customer Complaint",
    diagnosis: "Diagnosis",
    bay: "Bay",
    odometer: "Odometer",
    servicesTotal: "Services Total",
    partsTotal: "Parts Total",
    issued: "Issued",
    due: "Due",
    created: "Created",
    started: "Started",
    completed: "Completed",
    thankYou: "Thank you for your business",
    walkIn: "Walk-in Customer",
    partNum: "Part #",
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    manual: "Manual",
  },
  mn: {
    invoice: "НЭХЭЛГЭЭ",
    workOrder: "АЖЛЫН ЗАХИАЛГА",
    billTo: "Захиалагч",
    vehicle: "Тэрэг",
    customer: "Үйлчлүүлэгч",
    details: "Дэлгэрэнгүй",
    items: "Эд хогш",
    services: "Үйлчилгээ",
    parts: "Эд хогс",
    description: "Тайлбар",
    qty: "Тоо",
    unitPrice: "Нэгж үнэ",
    discount: "Хөнгөлөлт",
    total: "Нийт",
    subtotal: "Дүн",
    grandTotal: "Нийт дүн",
    amountPaid: "Төлсөн",
    balanceDue: "Үлдэгдэл",
    paymentHistory: "Төлбөрийн түүх",
    date: "Огноо",
    method: "Арга",
    reference: "Лавлагаа",
    notes: "Тэмдэглэл",
    terms: "Нөхцөл",
    mechanicNotes: "Механикийн тэмдэглэл",
    complaint: "Гомдол",
    diagnosis: "Онош",
    bay: "Бэй",
    odometer: "Гүйлтийн км",
    servicesTotal: "Үйлчилгээний дүн",
    partsTotal: "Эд хогсийн дүн",
    issued: "Олгосон",
    due: "Хугацаа",
    created: "Үүсгэсэн",
    started: "Эхэлсэн",
    completed: "Дууссан",
    thankYou: "Хамтран ажилласанд баярлалаа",
    walkIn: "Зочин үйлчлүүлэгч",
    partNum: "Барааны №",
    cash: "Бэлэн",
    card: "Карт",
    bank_transfer: "Шилжүүлэг",
    manual: "Гараар",
  },
};

/** Get a translated label */
export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

// ── Colors ───────────────────────────────────────────────────

export const colors = {
  black: "#1a1a1a",
  dark: "#333333",
  gray: "#666666",
  lightGray: "#999999",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
  primary: "#2563eb",
  destructive: "#dc2626",
  success: "#16a34a",
} as const;

// ── Currency Formatting ──────────────────────────────────────

const mntFormatter = new Intl.NumberFormat("mn-MN", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatters: Record<string, Intl.NumberFormat> = {
  MNT: mntFormatter,
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }),
  CNY: new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }),
  EUR: new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }),
};

export function formatAmount(amount: number, currency: string = "MNT"): string {
  const key = currency.toUpperCase();
  const fmt = currencyFormatters[key];
  if (!fmt) return `${key} ${amount.toLocaleString()}`;
  return key === "MNT" ? `₮${fmt.format(amount)}` : fmt.format(amount);
}

// ── Date Formatting ──────────────────────────────────────────

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Styles ───────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.black,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  businessName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.black,
    marginBottom: 4,
  },
  businessDetail: { fontSize: 8, color: colors.gray, marginBottom: 1 },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    textAlign: "right",
    marginBottom: 2,
  },
  invoiceDate: { fontSize: 8, color: colors.gray, textAlign: "right" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoGrid: { flexDirection: "row", gap: 24, marginBottom: 16 },
  infoBlock: { flex: 1 },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.lightGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: { fontSize: 9, color: colors.dark, marginBottom: 1 },
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 24,
  },
  tableRowEven: { backgroundColor: colors.background },
  tableCell: { fontSize: 8, color: colors.dark },
  tableCellRight: { fontSize: 8, color: colors.dark, textAlign: "right" },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  tableCellMuted: { fontSize: 7, color: colors.lightGray },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsTable: { width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalRowLabel: { fontSize: 9, color: colors.gray },
  totalRowValue: { fontSize: 9, color: colors.dark, textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.dark,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.black,
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
  },
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  notesText: { fontSize: 8, color: colors.dark },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: colors.lightGray,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    marginVertical: 8,
  },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
});
