/**
 * Invoice PDF Document — supports English and Mongolian.
 *
 * Usage:
 *   <InvoiceDocument invoice={invoice} org={org} locale="mn" />
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { InvoiceWithItems } from "@/lib/types";
import {
  colors,
  formatAmount,
  formatDate,
  type Locale,
  sharedStyles,
  t,
} from "./pdf-styles";

interface InvoiceDocumentProps {
  invoice: InvoiceWithItems;
  org: { name: string; logo_url?: string | null };
  branch?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  settings?: {
    default_currency?: string | null;
    default_tax_rate?: number | null;
  } | null;
  locale?: Locale;
}

const statusColors: Record<string, string> = {
  draft: colors.lightGray,
  sent: colors.primary,
  paid: colors.success,
  partial: "#f59e0b",
  overdue: colors.destructive,
  cancelled: colors.lightGray,
};

const methodLabels: Record<string, Record<string, string>> = {
  en: {
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    manual: "Manual",
  },
  mn: {
    cash: "Бэлэн",
    card: "Карт",
    bank_transfer: "Шилжүүлэг",
    manual: "Гараар",
  },
};

export function InvoiceDocument({
  invoice,
  org,
  branch,
  settings,
  locale = "mn",
}: InvoiceDocumentProps) {
  const L = (key: string) => t(locale, key);
  const currency = settings?.default_currency ?? "MNT";
  const items = invoice.items ?? [];
  const payments = invoice.payments ?? [];
  const serviceItems = items.filter((i) => i.item_type === "service");
  const partItems = items.filter((i) => i.item_type === "part");
  const servicesTotal = serviceItems.reduce((sum, i) => sum + i.total_price, 0);
  const partsTotal = partItems.reduce((sum, i) => sum + i.total_price, 0);

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Header */}
        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.businessName}>{org.name}</Text>
            {branch?.address && (
              <Text style={sharedStyles.businessDetail}>{branch.address}</Text>
            )}
            {branch?.phone && (
              <Text style={sharedStyles.businessDetail}>
                Tel: {branch.phone}
              </Text>
            )}
            {branch?.email && (
              <Text style={sharedStyles.businessDetail}>{branch.email}</Text>
            )}
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.invoiceTitle}>{L("invoice")}</Text>
            <Text style={sharedStyles.invoiceNumber}>
              {invoice.invoice_number}
            </Text>
            <Text style={sharedStyles.invoiceDate}>
              {L("issued")}: {formatDate(invoice.issued_at)}
            </Text>
            {invoice.due_at && (
              <Text style={sharedStyles.invoiceDate}>
                {L("due")}: {formatDate(invoice.due_at)}
              </Text>
            )}
            <View
              style={{
                ...sharedStyles.statusBadge,
                backgroundColor: `${statusColors[invoice.status] ?? colors.lightGray}20`,
              }}
            >
              <Text
                style={{
                  ...sharedStyles.statusText,
                  color: statusColors[invoice.status] ?? colors.lightGray,
                }}
              >
                {invoice.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To / Vehicle */}
        <View style={sharedStyles.infoGrid}>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>{L("billTo")}</Text>
            {invoice.customer_name ? (
              <Text style={sharedStyles.infoValue}>
                {invoice.customer_name}
              </Text>
            ) : (
              <Text style={sharedStyles.infoValue}>{L("walkIn")}</Text>
            )}
            {invoice.customer_phone && (
              <Text style={sharedStyles.infoValue}>
                {invoice.customer_phone}
              </Text>
            )}
            {invoice.customer_email && (
              <Text style={sharedStyles.infoValue}>
                {invoice.customer_email}
              </Text>
            )}
            {invoice.customer_address && (
              <Text style={sharedStyles.infoValue}>
                {invoice.customer_address}
              </Text>
            )}
          </View>
          {(invoice.vehicle_plate || invoice.vehicle_details) && (
            <View style={sharedStyles.infoBlock}>
              <Text style={sharedStyles.infoLabel}>{L("vehicle")}</Text>
              {invoice.vehicle_plate && (
                <Text style={sharedStyles.infoValue}>
                  {invoice.vehicle_plate}
                </Text>
              )}
              {invoice.vehicle_details && (
                <Text style={sharedStyles.infoValue}>
                  {invoice.vehicle_details}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>{L("items")}</Text>
          <View style={sharedStyles.tableHeader}>
            <View style={{ width: 32 }}>
              <Text style={sharedStyles.tableHeaderText}>Type</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sharedStyles.tableHeaderText}>
                {L("description")}
              </Text>
            </View>
            <View style={{ width: 40, alignItems: "center" }}>
              <Text style={sharedStyles.tableHeaderText}>{L("qty")}</Text>
            </View>
            <View style={{ width: 80, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>{L("unitPrice")}</Text>
            </View>
            <View style={{ width: 60, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>{L("discount")}</Text>
            </View>
            <View style={{ width: 80, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>{L("total")}</Text>
            </View>
          </View>

          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                sharedStyles.tableRow,
                idx % 2 === 1 ? sharedStyles.tableRowEven : {},
              ]}
            >
              <View style={{ width: 32 }}>
                <Text
                  style={{
                    ...sharedStyles.tableCellMuted,
                    fontSize: 7,
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {item.item_type === "service" ? "SVC" : "PRT"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.tableCell}>{item.description}</Text>
              </View>
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={sharedStyles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableCell}>
                  {formatAmount(item.unit_price, currency)}
                </Text>
              </View>
              <View style={{ width: 60, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableCell}>
                  {item.discount_amount > 0
                    ? `-${formatAmount(item.discount_amount, currency)}`
                    : "—"}
                </Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(item.total_price, currency)}
                </Text>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View style={sharedStyles.tableRow}>
              <Text style={sharedStyles.tableCellMuted}>No items</Text>
            </View>
          )}
        </View>

        {/* Category Subtotals */}
        {(serviceItems.length > 0 || partItems.length > 0) && (
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            {serviceItems.length > 0 && (
              <View>
                <Text style={sharedStyles.tableCellMuted}>
                  {L("servicesTotal")}
                </Text>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(servicesTotal, currency)}
                </Text>
              </View>
            )}
            {partItems.length > 0 && (
              <View>
                <Text style={sharedStyles.tableCellMuted}>
                  {L("partsTotal")}
                </Text>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(partsTotal, currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Totals */}
        <View style={sharedStyles.totalsSection}>
          <View style={sharedStyles.totalsTable}>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalRowLabel}>{L("subtotal")}</Text>
              <Text style={sharedStyles.totalRowValue}>
                {formatAmount(invoice.subtotal, currency)}
              </Text>
            </View>
            {invoice.discount_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>{L("discount")}</Text>
                <Text
                  style={{
                    ...sharedStyles.totalRowValue,
                    color: colors.destructive,
                  }}
                >
                  -{formatAmount(invoice.discount_total, currency)}
                </Text>
              </View>
            )}
            {invoice.tax_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>Tax</Text>
                <Text style={sharedStyles.totalRowValue}>
                  {formatAmount(invoice.tax_total, currency)}
                </Text>
              </View>
            )}
            <View style={sharedStyles.grandTotalRow}>
              <Text style={sharedStyles.grandTotalLabel}>
                {L("grandTotal")}
              </Text>
              <Text style={sharedStyles.grandTotalValue}>
                {formatAmount(invoice.total, currency)}
              </Text>
            </View>
            {invoice.amount_paid > 0 && (
              <>
                <View style={sharedStyles.totalRow}>
                  <Text style={sharedStyles.totalRowLabel}>
                    {L("amountPaid")}
                  </Text>
                  <Text
                    style={{
                      ...sharedStyles.totalRowValue,
                      color: colors.success,
                    }}
                  >
                    {formatAmount(invoice.amount_paid, currency)}
                  </Text>
                </View>
                <View style={sharedStyles.totalRow}>
                  <Text
                    style={{
                      ...sharedStyles.totalRowLabel,
                      fontFamily: "Helvetica-Bold",
                    }}
                  >
                    {L("balanceDue")}
                  </Text>
                  <Text
                    style={{
                      ...sharedStyles.totalRowValue,
                      fontFamily: "Helvetica-Bold",
                      color:
                        invoice.balance_due > 0
                          ? colors.destructive
                          : colors.success,
                    }}
                  >
                    {formatAmount(invoice.balance_due, currency)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>{L("paymentHistory")}</Text>
            <View style={sharedStyles.tableHeader}>
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.tableHeaderText}>{L("date")}</Text>
              </View>
              <View style={{ width: 80 }}>
                <Text style={sharedStyles.tableHeaderText}>{L("method")}</Text>
              </View>
              <View style={{ width: 100 }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("reference")}
                </Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>{L("total")}</Text>
              </View>
            </View>
            {payments.map((payment, idx) => (
              <View
                key={payment.id}
                style={[
                  sharedStyles.tableRow,
                  idx % 2 === 1 ? sharedStyles.tableRowEven : {},
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={sharedStyles.tableCell}>
                    {formatDate(payment.paid_at)}
                  </Text>
                </View>
                <View style={{ width: 80 }}>
                  <Text style={sharedStyles.tableCell}>
                    {methodLabels[locale]?.[payment.method] ??
                      payment.method.replace("_", " ")}
                  </Text>
                </View>
                <View style={{ width: 100 }}>
                  <Text style={sharedStyles.tableCellMuted}>
                    {payment.reference ?? "—"}
                  </Text>
                </View>
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCellBold}>
                    {formatAmount(payment.amount, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={sharedStyles.notesSection}>
            {invoice.notes && (
              <View style={sharedStyles.mb8}>
                <Text style={sharedStyles.notesLabel}>{L("notes")}</Text>
                <Text style={sharedStyles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={sharedStyles.notesLabel}>{L("terms")}</Text>
                <Text style={sharedStyles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={sharedStyles.footer}>
          {invoice.footer ?? `${L("thankYou")} — ${org.name}`}
        </Text>
      </Page>
    </Document>
  );
}
