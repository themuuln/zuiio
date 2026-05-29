/**
 * PDF generation module for TOLOM.
 *
 * Usage:
 *   import { renderToPdfBuffer, pdfFilename } from "@/lib/utils/pdf";
 *   import { InvoiceDocument } from "@/lib/pdf";
 *   import { WorkOrderDocument } from "@/lib/pdf";
 */

export { InvoiceDocument } from "./invoice-document";
export { WorkOrderDocument } from "./work-order-document";
export {
  colors,
  formatAmount,
  formatDate,
  sharedStyles,
  t,
} from "./pdf-styles";
export type { Locale } from "./pdf-styles";
