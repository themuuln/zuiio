/**
 * Work Order PDF Document — supports English and Mongolian.
 *
 * Usage:
 *   <WorkOrderDocument workOrder={wo} org={org} locale="mn" />
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { WorkOrderDetail } from "@/lib/types";
import {
  colors,
  formatAmount,
  formatDate,
  type Locale,
  sharedStyles,
  t,
} from "./pdf-styles";

interface WorkOrderDocumentProps {
  workOrder: WorkOrderDetail;
  org: { name: string; logo_url?: string | null };
  branch?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  settings?: {
    default_currency?: string | null;
  } | null;
  locale?: Locale;
}

const statusColors: Record<string, string> = {
  New: colors.primary,
  Diagnosing: "#f59e0b",
  "In Progress": "#8b5cf6",
  "Ready for Pickup": colors.success,
  Completed: colors.success,
  Cancelled: colors.lightGray,
};

export function WorkOrderDocument({
  workOrder: wo,
  org,
  branch,
  settings,
  locale = "mn",
}: WorkOrderDocumentProps) {
  const L = (key: string) => t(locale, key);
  const currency = settings?.default_currency ?? "MNT";
  const services = wo.services ?? [];
  const parts = wo.parts ?? [];
  const servicesTotal = services.reduce((sum, s) => sum + s.final_price, 0);
  const partsTotal = parts.reduce((sum, p) => sum + p.final_price, 0);
  const customerName = wo.customer
    ? `${wo.customer.first_name} ${wo.customer.last_name}`
    : null;
  const vehicleDesc = wo.vehicle
    ? [wo.vehicle.make, wo.vehicle.model, wo.vehicle.year]
        .filter(Boolean)
        .join(" ")
    : null;

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
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.invoiceTitle}>{L("workOrder")}</Text>
            <Text style={sharedStyles.invoiceNumber}>
              WO #{wo.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={sharedStyles.invoiceDate}>
              {L("created")}: {formatDate(wo.created_at)}
            </Text>
            {wo.started_at && (
              <Text style={sharedStyles.invoiceDate}>
                {L("started")}: {formatDate(wo.started_at)}
              </Text>
            )}
            {wo.completed_at && (
              <Text style={sharedStyles.invoiceDate}>
                {L("completed")}: {formatDate(wo.completed_at)}
              </Text>
            )}
            <View
              style={{
                ...sharedStyles.statusBadge,
                backgroundColor: `${statusColors[wo.status] ?? colors.lightGray}20`,
              }}
            >
              <Text
                style={{
                  ...sharedStyles.statusText,
                  color: statusColors[wo.status] ?? colors.lightGray,
                }}
              >
                {wo.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer / Vehicle / Details */}
        <View style={sharedStyles.infoGrid}>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>{L("customer")}</Text>
            {customerName ? (
              <Text style={sharedStyles.infoValue}>{customerName}</Text>
            ) : (
              <Text style={sharedStyles.infoValue}>{L("walkIn")}</Text>
            )}
            {wo.customer?.phone && (
              <Text style={sharedStyles.infoValue}>{wo.customer.phone}</Text>
            )}
            {wo.customer?.email && (
              <Text style={sharedStyles.infoValue}>{wo.customer.email}</Text>
            )}
          </View>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>{L("vehicle")}</Text>
            {wo.vehicle?.plate_number && (
              <Text
                style={{
                  ...sharedStyles.infoValue,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                {wo.vehicle.plate_number}
              </Text>
            )}
            {vehicleDesc && (
              <Text style={sharedStyles.infoValue}>{vehicleDesc}</Text>
            )}
            {wo.odometer_at_service != null && (
              <Text style={sharedStyles.infoValue}>
                {L("odometer")}: {wo.odometer_at_service.toLocaleString()} km
              </Text>
            )}
          </View>
          <View style={sharedStyles.infoBlock}>
            <Text style={sharedStyles.infoLabel}>{L("details")}</Text>
            {wo.bay_number != null && (
              <Text style={sharedStyles.infoValue}>
                {L("bay")} {wo.bay_number}
              </Text>
            )}
            {wo.diagnosis_label && (
              <Text style={sharedStyles.infoValue}>
                {wo.diagnosis_label.name}
              </Text>
            )}
          </View>
        </View>

        {/* Complaint & Diagnosis */}
        {(wo.complaint || wo.diagnosis) && (
          <View style={sharedStyles.section}>
            {wo.complaint && (
              <View style={sharedStyles.mb8}>
                <Text style={sharedStyles.infoLabel}>{L("complaint")}</Text>
                <Text style={sharedStyles.infoValue}>{wo.complaint}</Text>
              </View>
            )}
            {wo.diagnosis && (
              <View>
                <Text style={sharedStyles.infoLabel}>{L("diagnosis")}</Text>
                <Text style={sharedStyles.infoValue}>{wo.diagnosis}</Text>
              </View>
            )}
          </View>
        )}

        {/* Services Table */}
        {services.length > 0 && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>{L("services")}</Text>
            <View style={sharedStyles.tableHeader}>
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("description")}
                </Text>
              </View>
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={sharedStyles.tableHeaderText}>{L("qty")}</Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("unitPrice")}
                </Text>
              </View>
              <View style={{ width: 60, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("discount")}
                </Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>{L("total")}</Text>
              </View>
            </View>
            {services.map((service, idx) => (
              <View
                key={service.id}
                style={[
                  sharedStyles.tableRow,
                  idx % 2 === 1 ? sharedStyles.tableRowEven : {},
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={sharedStyles.tableCell}>
                    {service.service_name}
                  </Text>
                  {service.notes && (
                    <Text style={sharedStyles.tableCellMuted}>
                      {service.notes}
                    </Text>
                  )}
                </View>
                <View style={{ width: 40, alignItems: "center" }}>
                  <Text style={sharedStyles.tableCell}>{service.quantity}</Text>
                </View>
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCell}>
                    {formatAmount(service.unit_price, currency)}
                  </Text>
                </View>
                <View style={{ width: 60, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCell}>
                    {service.discount_amount != null &&
                    service.discount_amount > 0
                      ? `-${formatAmount(service.discount_amount, currency)}`
                      : "—"}
                  </Text>
                </View>
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCellBold}>
                    {formatAmount(service.final_price, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Parts Table */}
        {parts.length > 0 && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>{L("parts")}</Text>
            <View style={sharedStyles.tableHeader}>
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("description")}
                </Text>
              </View>
              <View style={{ width: 60 }}>
                <Text style={sharedStyles.tableHeaderText}>{L("partNum")}</Text>
              </View>
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={sharedStyles.tableHeaderText}>{L("qty")}</Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>
                  {L("unitPrice")}
                </Text>
              </View>
              <View style={{ width: 80, alignItems: "flex-end" }}>
                <Text style={sharedStyles.tableHeaderText}>{L("total")}</Text>
              </View>
            </View>
            {parts.map((part, idx) => (
              <View
                key={part.id}
                style={[
                  sharedStyles.tableRow,
                  idx % 2 === 1 ? sharedStyles.tableRowEven : {},
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={sharedStyles.tableCell}>{part.part_name}</Text>
                </View>
                <View style={{ width: 60 }}>
                  <Text style={sharedStyles.tableCellMuted}>
                    {part.part_number ?? "—"}
                  </Text>
                </View>
                <View style={{ width: 40, alignItems: "center" }}>
                  <Text style={sharedStyles.tableCell}>{part.quantity}</Text>
                </View>
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCell}>
                    {formatAmount(part.unit_price, currency)}
                  </Text>
                </View>
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Text style={sharedStyles.tableCellBold}>
                    {formatAmount(part.final_price, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={sharedStyles.totalsSection}>
          <View style={sharedStyles.totalsTable}>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalRowLabel}>{L("services")}</Text>
              <Text style={sharedStyles.totalRowValue}>
                {formatAmount(servicesTotal, currency)}
              </Text>
            </View>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalRowLabel}>{L("parts")}</Text>
              <Text style={sharedStyles.totalRowValue}>
                {formatAmount(partsTotal, currency)}
              </Text>
            </View>
            {wo.discount_total > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalRowLabel}>{L("discount")}</Text>
                <Text
                  style={{
                    ...sharedStyles.totalRowValue,
                    color: colors.destructive,
                  }}
                >
                  -{formatAmount(wo.discount_total, currency)}
                </Text>
              </View>
            )}
            <View style={sharedStyles.grandTotalRow}>
              <Text style={sharedStyles.grandTotalLabel}>
                {L("grandTotal")}
              </Text>
              <Text style={sharedStyles.grandTotalValue}>
                {formatAmount(wo.total, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mechanic Notes */}
        {wo.mechanic_notes && (
          <View style={sharedStyles.notesSection}>
            <Text style={sharedStyles.notesLabel}>{L("mechanicNotes")}</Text>
            <Text style={sharedStyles.notesText}>{wo.mechanic_notes}</Text>
          </View>
        )}

        {/* Notes */}
        {wo.notes && (
          <View style={{ ...sharedStyles.notesSection, marginTop: 8 }}>
            <Text style={sharedStyles.notesLabel}>{L("notes")}</Text>
            <Text style={sharedStyles.notesText}>{wo.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={sharedStyles.footer}>
          {org.name} — WO #{wo.id.slice(0, 8).toUpperCase()}
        </Text>
      </Page>
    </Document>
  );
}
