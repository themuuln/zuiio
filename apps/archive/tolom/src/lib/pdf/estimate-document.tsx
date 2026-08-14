/**
 * Estimate PDF Document — supports English and Mongolian.
 *
 * Usage:
 *   <EstimateDocument estimate={estimate} org={org} locale="mn" />
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  colors,
  formatAmount,
  formatDate,
  type Locale,
  sharedStyles,
  t,
} from "./pdf-styles";

interface EstimateDocumentProps {
  estimate: {
    estimate_number: string;
    status: string;
    created_at: string;
    valid_until: string | null;
    notes: string | null;
    terms: string | null;
    subtotal: number;
    discount_amount: number;
    discount_percentage: number;
    discount_total: number;
    tax_total: number;
    grand_total: number;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      email: string | null;
    } | null;
    vehicle: {
      plate_number: string | null;
      make: string | null;
      model: string | null;
      year: number | null;
    } | null;
    items: {
      description: string;
      item_type: string;
      quantity: number;
      unit_price: number;
      discount_amount: number;
      discount_percentage: number;
      line_total: number;
    }[];
  };
  org: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  locale?: Locale;
}

const statusColors: Record<string, string> = {
  draft: colors.lightGray,
  sent: colors.primary,
  approved: colors.success,
  declined: colors.destructive,
  expired: "#f59e0b",
  converted: "#8b5cf6",
};

const itemTypeLabels: Record<string, Record<string, string>> = {
  en: { service: "SVC", part: "PRT", custom: "CUS" },
  mn: { service: "ҮЙЛ", part: "ЭД", custom: "ӨӨР" },
};

export function EstimateDocument({
  estimate,
  org,
  locale = "mn",
}: EstimateDocumentProps) {
  const L = (key: string) => t(locale, key);
  const items = estimate.items ?? [];

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Header */}
        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.businessName}>{org.name}</Text>
            {org.address && (
              <Text style={sharedStyles.businessDetail}>{org.address}</Text>
            )}
            {org.phone && (
              <Text style={sharedStyles.businessDetail}>Tel: {org.phone}</Text>
            )}
            {org.email && (
              <Text style={sharedStyles.businessDetail}>{org.email}</Text>
            )}
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.invoiceTitle}>{L("estimate")}</Text>
            <Text style={sharedStyles.invoiceNumber}>
              {estimate.estimate_number}
            </Text>
            <Text style={sharedStyles.invoiceDate}>
              {L("created")}: {formatDate(estimate.created_at)}
            </Text>
            {estimate.valid_until && (
              <Text style={sharedStyles.invoiceDate}>
                {L("validUntil")}: {formatDate(estimate.valid_until)}
              </Text>
            )}
            <View
              style={{
                ...sharedStyles.statusBadge,
                backgroundColor: `${statusColors[estimate.status] ?? colors.lightGray}20`,
              }}
            >
              <Text
                style={{
                  ...sharedStyles.statusText,
                  color: statusColors[estimate.status] ?? colors.lightGray,
                }}
              >
                {estimate.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To / Vehicle */}
        <View style={sharedStyles.infoGrid}>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>{L("billTo")}</Text>
            {estimate.customer ? (
              <Text style={sharedStyles.infoValue}>
                {[estimate.customer.first_name, estimate.customer.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            ) : (
              <Text style={sharedStyles.infoValue}>—</Text>
            )}
            {estimate.customer?.phone && (
              <Text style={sharedStyles.infoValue}>
                {estimate.customer.phone}
              </Text>
            )}
            {estimate.customer?.email && (
              <Text style={sharedStyles.infoValue}>
                {estimate.customer.email}
              </Text>
            )}
          </View>
          {estimate.vehicle && (
            <View style={sharedStyles.infoBlock}>
              <Text style={sharedStyles.infoLabel}>{L("vehicle")}</Text>
              {estimate.vehicle.plate_number && (
                <Text style={sharedStyles.infoValue}>
                  {estimate.vehicle.plate_number}
                </Text>
              )}
              {[
                estimate.vehicle.year,
                estimate.vehicle.make,
                estimate.vehicle.model,
              ]
                .filter(Boolean)
                .join(" ") && (
                <Text style={sharedStyles.infoValue}>
                  {[
                    estimate.vehicle.year,
                    estimate.vehicle.make,
                    estimate.vehicle.model,
                  ]
                    .filter(Boolean)
                    .join(" ")}
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
              key={idx}
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
                  {itemTypeLabels[locale]?.[item.item_type] ?? item.item_type}
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
                  {formatAmount(item.unit_price)}
                </Text>
              </View>
              <View style={{ width: 60, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableCell}>
                  {item.discount_amount > 0
                    ? `-${formatAmount(item.discount_amount)}`
                    : item.discount_percentage > 0
                      ? `${item.discount_percentage}%`
                      : "—"}
                </Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableCellBold}>
                  {formatAmount(item.line_total)}
                </Text>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View style={sharedStyles.tableRow}>
              <Text style={sharedStyles.tableCellMuted}>{L("noItems")}</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={sharedStyles.totalsSection}>
          <View style={sharedStyles.totalsTable}>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalRowLabel}>{L("subtotal")}</Text>
              <Text style={sharedStyles.totalRowValue}>
                {formatAmount(estimate.subtotal)}
              </Text>
            </View>
            {estimate.discount_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>{L("discount")}</Text>
                <Text
                  style={{
                    ...sharedStyles.totalRowValue,
                    color: colors.destructive,
                  }}
                >
                  -{formatAmount(estimate.discount_total)}
                </Text>
              </View>
            )}
            {estimate.tax_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>{L("tax")}</Text>
                <Text style={sharedStyles.totalRowValue}>
                  {formatAmount(estimate.tax_total)}
                </Text>
              </View>
            )}
            <View style={sharedStyles.grandTotalRow}>
              <Text style={sharedStyles.grandTotalLabel}>
                {L("grandTotal")}
              </Text>
              <Text style={sharedStyles.grandTotalValue}>
                {formatAmount(estimate.grand_total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {(estimate.notes || estimate.terms) && (
          <View style={sharedStyles.notesSection}>
            {estimate.notes && (
              <View style={{ marginBottom: 8 }}>
                <Text style={sharedStyles.notesLabel}>{L("notes")}</Text>
                <Text style={sharedStyles.notesText}>{estimate.notes}</Text>
              </View>
            )}
            {estimate.terms && (
              <View>
                <Text style={sharedStyles.notesLabel}>{L("terms")}</Text>
                <Text style={sharedStyles.notesText}>{estimate.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={sharedStyles.footer}>
          {`${L("thankYou")} — ${org.name}`}
        </Text>
      </Page>
    </Document>
  );
}
