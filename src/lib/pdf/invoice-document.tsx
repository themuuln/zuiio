/**
 * Invoice PDF Document — renders a professional invoice using @react-pdf/renderer.
 *
 * Usage:
 *   import { InvoiceDocument } from "@/lib/pdf/invoice-document";
 *   import { renderToPdfBuffer } from "@/lib/utils/pdf";
 *   const buffer = await renderToPdfBuffer(
 *     <InvoiceDocument invoice={invoice} org={org} branch={branch} settings={settings} />
 *   );
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { InvoiceWithItems } from "@/lib/types";
import {
  colors,
  formatAmount,
  formatDate,
  formatDateTime,
  sharedStyles,
} from "./pdf-styles";

// ── Types ────────────────────────────────────────────────────

interface InvoiceDocumentProps {
  invoice: InvoiceWithItems;
  org: {
    name: string;
    logo_url?: string | null;
  };
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
}

// ── Status Colors ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  draft: colors.lightGray,
  sent: colors.primary,
  paid: colors.success,
  partial: "#f59e0b",
  overdue: colors.destructive,
  cancelled: colors.lightGray,
};

// ── Component ────────────────────────────────────────────────

export function InvoiceDocument({
  invoice,
  org,
  branch,
  settings,
}: InvoiceDocumentProps) {
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
        {/* ── Header ─────────────────────────────── */}
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
            <Text style={sharedStyles.invoiceTitle}>INVOICE</Text>
            <Text style={sharedStyles.invoiceNumber}>
              {invoice.invoice_number}
            </Text>
            <Text style={sharedStyles.invoiceDate}>
              Issued: {formatDate(invoice.issued_at)}
            </Text>
            {invoice.due_at && (
              <Text style={sharedStyles.invoiceDate}>
                Due: {formatDate(invoice.due_at)}
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

        {/* ── Bill To / Vehicle ───────────────────── */}
        <View style={sharedStyles.infoGrid}>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>Bill To</Text>
            {invoice.customer_name && (
              <Text style={sharedStyles.infoValue}>
                {invoice.customer_name}
              </Text>
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
            {!invoice.customer_name && (
              <Text style={sharedStyles.infoValue}>Walk-in Customer</Text>
            )}
          </View>
          {(invoice.vehicle_plate || invoice.vehicle_details) && (
            <View style={sharedStyles.infoBlock}>
              <Text style={sharedStyles.infoLabel}>Vehicle</Text>
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

        {/* ── Line Items Table ────────────────────── */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Items</Text>

          {/* Table Header */}
          <View style={sharedStyles.tableHeader}>
            <View style={{ width: 32 }}>
              <Text style={sharedStyles.tableHeaderText}>Type</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sharedStyles.tableHeaderText}>Description</Text>
            </View>
            <View style={{ width: 40, alignItems: "center" }}>
              <Text style={sharedStyles.tableHeaderText}>Qty</Text>
            </View>
            <View style={{ width: 80, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>Unit Price</Text>
            </View>
            <View style={{ width: 60, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>Discount</Text>
            </View>
            <View style={{ width: 80, alignItems: "flex-end" }}>
              <Text style={sharedStyles.tableHeaderText}>Total</Text>
            </View>
          </View>

          {/* Table Rows */}
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

        {/* ── Category Subtotals ──────────────────── */}
        {(serviceItems.length > 0 || partItems.length > 0) && (
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            {serviceItems.length > 0 && (
              <View>
                <Text style={sharedStyles.tableCellMuted}>Services Total</Text>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(servicesTotal, currency)}
                </Text>
              </View>
            )}
            {partItems.length > 0 && (
              <View>
                <Text style={sharedStyles.tableCellMuted}>Parts Total</Text>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(partsTotal, currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Totals ──────────────────────────────── */}
        <View style={sharedStyles.totalsSection}>
          <View style={sharedStyles.totalsTable}>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalRowLabel}>Subtotal</Text>
              <Text style={sharedStyles.totalRowValue}>
                {formatAmount(invoice.subtotal, currency)}
              </Text>
            </View>

            {invoice.discount_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>Discount</Text>
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
              <Text style={sharedStyles.grandTotalLabel}>Total</Text>
              <Text style={sharedStyles.grandTotalValue}>
                {formatAmount(invoice.total, currency)}
              </Text>
            </View>

            {invoice.amount_paid > 0 && (
              <>
                <View style={sharedStyles.totalRow}>
                  <Text style={sharedStyles.totalRowLabel}>Amount Paid</Text>
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
                    Balance Due
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

        {/* ── Payment History ─────────────────────── */}
        {payments.length > 0 && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>Payment History</Text>

            <View style={sharedStyles.tableHeader}>
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.tableHeaderText}>Date</Text>
              </View>
              <View style={{ width: 80 }}>
                <Text style={sharedStyles.tableHeaderText}>Method</Text>
              </View>
              <View style={{ width: 100 }}>
                <Text style={sharedStyles.tableHeaderText}>Reference</Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>Amount</Text>
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
                    {payment.method.replace("_", " ")}
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

        {/* ── Notes & Terms ───────────────────────── */}
        {(invoice.notes || invoice.terms) && (
          <View style={sharedStyles.notesSection}>
            {invoice.notes && (
              <View style={sharedStyles.mb8}>
                <Text style={sharedStyles.notesLabel}>Notes</Text>
                <Text style={sharedStyles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={sharedStyles.notesLabel}>Terms</Text>
                <Text style={sharedStyles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Footer ──────────────────────────────── */}
        <Text style={sharedStyles.footer}>
          {invoice.footer ?? `Thank you for your business — ${org.name}`}
        </Text>
      </Page>
    </Document>
  );
}
